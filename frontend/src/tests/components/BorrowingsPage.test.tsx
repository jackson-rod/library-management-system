import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../utils/test-utils';
import BorrowingsPage from '../../components/BorrowingsPage';

describe('BorrowingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock-token-user');
  });

  it('allows returning an active borrowing', async () => {
    const user = userEvent.setup();
    render(<BorrowingsPage />);

    const returnButton = await screen.findByRole('button', { name: /return book/i });
    await user.click(returnButton);

    await waitFor(() =>
      expect(screen.getByText('Book returned successfully. Thank you!')).toBeInTheDocument()
    );

    await waitFor(() =>
      expect(screen.getByText('You have no active borrowings right now.')).toBeInTheDocument()
    );
  });

  it('shows history when toggling filters', async () => {
    const user = userEvent.setup();
    render(<BorrowingsPage />);

    const historyButton = screen.getByRole('button', { name: /history/i });
    await user.click(historyButton);

    await waitFor(() => {
      expect(screen.getByText('Clean Architecture')).toBeInTheDocument();
      expect(screen.getByText('Returned')).toBeInTheDocument();
    });
  });
});
