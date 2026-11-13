import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, X, ArrowLeft } from 'lucide-react';
import { useCreatePromotion } from '@/hooks/useAppPromotions';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expiresAt?: string;
  durationLabel?: string;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB (allows up to 5 min)
const MIN_VIDEO_DURATION = 15; // seconds
const MAX_VIDEO_DURATION = 300; // seconds (5 minutes)

const CreatePromotionDialog = ({ open, onOpenChange, expiresAt, durationLabel }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreatePromotion();
  const { toast } = useToast();

  const reset = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCaption('');
    setLinkUrl('');
  };

  const handleFile = async (f: File) => {
    const isVideo = f.type.startsWith('video/');
    if (!isVideo && !f.type.startsWith('image/')) {
      toast({ title: 'Only image or video allowed', variant: 'destructive' });
      return;
    }
    if (isVideo && f.size > MAX_VIDEO_BYTES) {
      toast({ title: 'Video must be under 200MB', variant: 'destructive' });
      return;
    }
    if (!isVideo && f.size > MAX_IMAGE_BYTES) {
      toast({ title: 'Image must be under 8MB', variant: 'destructive' });
      return;
    }
    if (isVideo) {
      const duration = await new Promise<number>((resolve) => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => resolve(v.duration);
        v.onerror = () => resolve(NaN);
        v.src = URL.createObjectURL(f);
      });
      if (!isFinite(duration) || duration < MIN_VIDEO_DURATION || duration > MAX_VIDEO_DURATION) {
        toast({
          title: 'Invalid video length',
          description: 'Owner can upload 15 sec to 5 min videos.',
          variant: 'destructive',
        });
        return;
      }
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      await create.mutateAsync({ file, caption: caption.trim(), linkUrl: linkUrl.trim(), expiresAt });
      toast({
        title: 'Promotion published',
        description: durationLabel ? `Live for ${durationLabel}.` : 'Live for 24 hours.',
      });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Failed to publish',
        description: err?.message || 'Try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="fixed inset-0 z-[100] w-full h-full max-w-none max-h-none p-0 bg-background text-foreground border-none rounded-none flex flex-col overflow-hidden !translate-x-0 !translate-y-0 !left-0 !top-0 opacity-100 shadow-none"
      >
        {/* Full Screen Header Bar */}
        <div className="shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { reset(); onOpenChange(false); }}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                New App Promotion
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Shown as status on Sha-Verse logo{durationLabel ? ` for ${durationLabel}` : ' for 24 hours'}.
              </DialogDescription>
            </div>
          </div>
          <button
            onClick={() => { reset(); onOpenChange(false); }}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-xl mx-auto w-full space-y-5 scrollbar-hide">
          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors p-6 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-foreground block">Upload image or video</span>
                <span className="text-xs text-muted-foreground">15 sec – 5 min max length</span>
              </div>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
              {file.type.startsWith('video/') ? (
                <video src={preview!} className="w-full h-full object-contain" controls />
              ) : (
                <img src={preview!} alt="" className="w-full h-full object-contain" />
              )}
              <button
                type="button"
                onClick={reset}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="promo-caption" className="text-sm font-semibold">Caption (optional)</Label>
            <Textarea
              id="promo-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Short pitch shown over the status media..."
              maxLength={140}
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="promo-link" className="text-sm font-semibold">Link URL (optional)</Label>
            <Input
              id="promo-link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Fixed Footer Bar */}
        <div className="shrink-0 p-4 sm:p-6 border-t border-border bg-background/95 backdrop-blur z-30">
          <div className="max-w-xl mx-auto">
            <Button
              onClick={handleSubmit}
              disabled={!file || create.isPending}
              className="w-full py-3.5 sm:py-4 text-base font-bold rounded-2xl shadow-lg"
            >
              {create.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Publish Promotion
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromotionDialog;
