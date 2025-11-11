import { api } from '@/config/axios';
import type { Book, PaginatedResponse } from '@/types/library';
import { normalizePaginator, type LaravelPaginator } from '@/utils/pagination';

interface BookListParams {
  search?: string;
  page?: number;
}

type BookListResponse = PaginatedResponse<Book>;

export const bookService = {
  async list(params: BookListParams = {}): Promise<BookListResponse> {
    const response = await api.get<BookListResponse | LaravelPaginator<Book>>('/books', {
      params,
    });

    return normalizePaginator<Book>(response.data);
  },

  async getById(id: number): Promise<Book> {
    const response = await api.get<Book>(`/books/${id}`);
    return response.data;
  },

  async create(payload: Omit<Book, 'id'>): Promise<Book> {
    const response = await api.post<{ book: Book; message: string }>('/books', payload);
    return response.data.book;
  },

  async update(id: number, payload: Partial<Omit<Book, 'id'>>): Promise<Book> {
    const response = await api.put<{ book: Book; message: string }>(`/books/${id}`, payload);
    return response.data.book;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/books/${id}`);
  },
};
