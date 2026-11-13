import { supabase } from "@/integrations/supabase/client";
import { IBookshelfService, BookItem } from "@/services/interfaces/IBookshelfService";

export const bookshelfSupabaseService: IBookshelfService = {
  async getBooks(category?: string): Promise<BookItem[]> {
    let query = supabase.from("books" as any).select("*").order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data } = await query;
    return (data || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      description: b.description,
      cover_url: b.cover_url,
      file_url: b.file_url,
      file_format: b.file_format || "pdf",
      category: b.category,
      rating: b.rating || 5,
      user_id: b.user_id,
      created_at: b.created_at,
    }));
  },

  async getBookById(bookId: string): Promise<BookItem | null> {
    const { data } = await supabase
      .from("books" as any)
      .select("*")
      .eq("id", bookId)
      .maybeSingle();

    if (!data) return null;
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      description: data.description,
      cover_url: data.cover_url,
      file_url: data.file_url,
      file_format: data.file_format || "pdf",
      category: data.category,
      rating: data.rating || 5,
      user_id: data.user_id,
      created_at: data.created_at,
    };
  },

  async uploadBook(payload: {
    title: string;
    author: string;
    description?: string;
    fileUrl: string;
    fileFormat: "pdf" | "epub";
    coverUrl?: string;
    category?: string;
  }): Promise<BookItem> {
    const { data: userSession } = await supabase.auth.getSession();
    const userId = userSession?.session?.user?.id;
    if (!userId) throw new Error("Authentication required to upload books.");

    const { data, error } = await supabase
      .from("books" as any)
      .insert({
        user_id: userId,
        title: payload.title,
        author: payload.author,
        description: payload.description,
        file_url: payload.fileUrl,
        file_format: payload.fileFormat,
        cover_url: payload.coverUrl,
        category: payload.category || "General",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBook(bookId: string): Promise<void> {
    await supabase.from("books" as any).delete().eq("id", bookId);
  },
};

export default bookshelfSupabaseService;
