import { api } from '@/config/axios';
import type { Borrow } from '@/types/library';

export const MAX_ACTIVE_BORROWS = 3;

interface BorrowResponse {
  data: Borrow;
}

interface BorrowCollectionResponse {
  data: Borrow[];
}

type BorrowFilter = 'active' | 'all';

export const borrowService = {
  async borrowBook(bookId: number): Promise<Borrow> {
    const response = await api.post<BorrowResponse>('/borrowings', {
      book_id: bookId,
    });

    return response.data.data;
  },

  async getMyBorrowings(filter: BorrowFilter = 'active'): Promise<Borrow[]> {
    const response = await api.get<BorrowCollectionResponse>('/me/borrowings', {
      params: { status: filter },
    });

    return response.data.data;
  },

  async returnBorrowing(borrowId: number): Promise<Borrow> {
    const response = await api.post<BorrowResponse>(`/borrowings/${borrowId}/return`);
    return response.data.data;
  },
};
