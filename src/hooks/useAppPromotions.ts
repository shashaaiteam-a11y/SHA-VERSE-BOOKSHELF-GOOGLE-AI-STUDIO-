import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressForUpload } from '@/lib/media/compressFile';

export interface AppPromotion {
  id: string;
  owner_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  link_url: string | null;
  created_at: string;
  expires_at: string;
  views_count: number;
}

const STORAGE_KEY = 'sha_verse_viewed_stories';

export const getViewedPromotionIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
};

export const markPromotionViewedLocal = (id: string) => {
  try {
    const set = getViewedPromotionIds();
    if (!set.has(id)) {
      set.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
      window.dispatchEvent(new CustomEvent('sha_verse_story_viewed', { detail: { id } }));
    }
  } catch {
    // ignore
  }
};

export const useViewedPromotionIds = () => {
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => getViewedPromotionIds());

  useEffect(() => {
    const handleUpdate = () => {
      setViewedIds(getViewedPromotionIds());
    };
    window.addEventListener('sha_verse_story_viewed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sha_verse_story_viewed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return viewedIds;
};

/** Is the current user an app admin/owner? Uses public.user_roles + has_role pattern. */
export const useIsAppOwner = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-app-owner', user?.id, user?.email],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (user?.email?.toLowerCase() === 'shashaaiteam@gmail.com') return true;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });
};

/** Active (non-expired) app promotions, ordered oldest -> newest for sequential play. */
export const useActiveAppPromotions = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['app-promotions-active'],
    staleTime: 2000,
    refetchInterval: 3000,
    queryFn: async (): Promise<AppPromotion[]> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('app_promotions')
        .select('*')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const list = (data || []) as AppPromotion[];
      // Filter out any items that just expired in real-time
      return list.filter((item) => new Date(item.expires_at).getTime() > Date.now());
    },
  });

  // Realtime postgres changes channel
  useEffect(() => {
    const channel = supabase
      .channel(`app-promotions-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_promotions' },
        () => queryClient.invalidateQueries({ queryKey: ['app-promotions-active'] })
      )
      .subscribe();

    // Ticking interval every 1 second to instantly auto-delete expired stories
    const timer = setInterval(() => {
      if (query.data && query.data.some((item) => new Date(item.expires_at).getTime() <= Date.now())) {
        queryClient.invalidateQueries({ queryKey: ['app-promotions-active'] });
      }
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [queryClient, query.data]);

  return query;
};

/** Realtime live view count for a specific promotion (eye icon counter). */
export const usePromotionLiveViews = (promotionId: string | null, initial = 0) => {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    if (!promotionId) return;
    setCount(initial);

    const channel = supabase
      .channel(`promo-views-${promotionId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_promotions',
          filter: `id=eq.${promotionId}`,
        },
        (payload) => {
          const next = (payload.new as { views_count?: number } | null)?.views_count;
          if (typeof next === 'number') setCount(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotionId]);

  return count;
};

/** Mark a promotion as viewed by the current user (idempotent via unique constraint). */
export const useRecordPromotionView = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (promotionId: string) => {
      if (!user?.id) return;
      await supabase
        .from('app_promotion_views')
        .insert({ promotion_id: promotionId, viewer_id: user.id })
        // duplicates are fine — unique constraint just blocks them silently
        .then(() => undefined, () => undefined);
    },
  });
};

/** Upload media + create a promotion row (admin only — enforced by RLS). */
export const useCreatePromotion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, caption, linkUrl, expiresAt }: { file: File; caption?: string; linkUrl?: string; expiresAt?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Compress before upload (image/video). Safe no-op on failure.
      const uploadFile = await compressForUpload(file);
      const isVideo = uploadFile.type.startsWith('video/');
      const bucket = isVideo ? 'videos' : 'post-images';
      const ext = uploadFile.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const path = `${user.id}/promo-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, uploadFile, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

      const payload: Record<string, unknown> = {
        owner_id: user.id,
        media_url: pub.publicUrl,
        media_type: isVideo ? 'video' : 'image',
        caption: caption || null,
        link_url: linkUrl || null,
      };
      if (expiresAt) payload.expires_at = expiresAt;

      const { error } = await supabase.from('app_promotions').insert(payload as never);
      if (error) throw error;
    },

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-promotions-active'] }),
  });
};

/** Delete a promotion (owner/admin only — enforced by RLS). */
export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promotionId: string) => {
      const { error } = await supabase
        .from('app_promotions')
        .delete()
        .eq('id', promotionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-promotions-active'] }),
  });
};
