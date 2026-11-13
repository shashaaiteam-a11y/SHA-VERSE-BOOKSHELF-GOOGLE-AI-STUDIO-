export interface BookItem {
  id: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  file_url: string;
  file_format: "pdf" | "epub";
  category?: string;
  rating?: number;
  user_id: string;
  created_at: string;
}

export interface IBookshelfService {
  getBooks(category?: string): Promise<BookItem[]>;
  getBookById(bookId: string): Promise<BookItem | null>;
  uploadBook(payload: {
    title: string;
    author: string;
    description?: string;
    fileUrl: string;
    fileFormat: "pdf" | "epub";
    coverUrl?: string;
    category?: string;
  }): Promise<BookItem>;
  deleteBook(bookId: string): Promise<void>;
}
