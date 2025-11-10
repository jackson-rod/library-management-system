import { api } from '@/config/axios';
import type { Book, PaginatedResponse } from '@/types/library';

interface BookListParams {
  search?: string;
  page?: number;
}

type BookListResponse = PaginatedResponse<Book>;

export const bookService = {
  async list(params: BookListParams = {}): Promise<BookListResponse> {
    const response = await api.get<BookListResponse>('/books', {
      params,
    });

    return response.data;
  },

  async getById(id: number): Promise<Book> {
    const response = await api.get<Book>(`/books/${id}`);
    return response.data;
  },
};
