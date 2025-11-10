import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '../utils/test-utils';
import BooksPage from '../../components/BooksPage';
import { setMockBorrowings, type MockBorrowRecord } from '../mocks/handlers';

const createActiveBorrow = (id: number, bookId: number): MockBorrowRecord => ({
  id,
  userId: 2,
  bookId,
  borrowedAt: new Date().toISOString(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  returnedAt: null,
});

describe('BooksPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock-token-user');
  });

  it('renders books and allows borrowing available titles', async () => {
    const user = userEvent.setup();
    render(<BooksPage />);

    const titleCell = await screen.findByText('Atomic Habits');
    const row = titleCell.closest('tr');
    expect(row).not.toBeNull();

    const borrowButton = within(row as HTMLTableRowElement).getByRole('button', { name: /borrow/i });
    expect(borrowButton).not.toBeDisabled();

    await user.click(borrowButton);

    await waitFor(() =>
      expect(
        screen.getByText('Book successfully borrowed. Check your dashboard for details.')
      ).toBeInTheDocument()
    );

    await waitFor(() => {
      const updatedRow = screen.getByText('Atomic Habits').closest('tr');
      expect(updatedRow).not.toBeNull();
      const updatedButton = within(updatedRow as HTMLTableRowElement).getByRole('button', {
        name: /borrow/i,
      });
      expect(updatedButton).toBeDisabled();
    });
  });

  it('disables borrowing when the active limit is reached', async () => {
    setMockBorrowings([
      createActiveBorrow(201, 1),
      createActiveBorrow(202, 2),
      createActiveBorrow(203, 3),
    ]);

    render(<BooksPage />);

    await screen.findByText('Limit reached');

    const row = screen.getByText('Atomic Habits').closest('tr');
    expect(row).not.toBeNull();
    const borrowButton = within(row as HTMLTableRowElement).getByRole('button', { name: /borrow/i });
    expect(borrowButton).toBeDisabled();
  });
});
