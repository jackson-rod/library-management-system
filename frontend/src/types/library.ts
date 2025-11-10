export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publication_year: number;
  available: boolean;
}

export type BorrowStatus = 'active' | 'overdue' | 'returned';

export interface Borrow {
  id: number;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  status: BorrowStatus;
  is_overdue: boolean;
  days_overdue: number;
  book: Book;
  user?: {
    id: number;
    name: string;
    email: string;
    library_id?: string;
    role: string;
  };
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
  links?: PaginationLinks;
}
