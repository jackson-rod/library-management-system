import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageBooksPage from '@/components/ManageBooksPage';

const mockUseAuth = vi.fn();
const mockShowToast = vi.fn();
const mockList = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/components/NavigationBar', () => ({
  default: () => <div data-testid="nav-bar">Nav</div>,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/services/bookService', () => ({
  bookService: {
    list: (...args: unknown[]) => mockList(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

const mockBookPaginatedResponse = () => ({
  data: [
    {
      id: 1,
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '9780735211292',
      publication_year: 2018,
      available: true,
    },
    {
      id: 2,
      title: 'Deep Work',
      author: 'Cal Newport',
      isbn: '9781455586691',
      publication_year: 2016,
      available: false,
    },
  ],
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '/api/books',
    per_page: 10,
    to: 2,
    total: 2,
  },
});

describe('ManageBooksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(mockBookPaginatedResponse());
  });

  it('blocks non-admins', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'User' } });
    render(<ManageBooksPage />);
    expect(screen.getByText('Admin access required')).toBeInTheDocument();
  });

  it('allows admins to view directory', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });
    render(<ManageBooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Atomic Habits')).toBeInTheDocument();
      expect(screen.getByText('Deep Work')).toBeInTheDocument();
    });

    expect(screen.getByText(/Total books/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('creates a new book', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });
    mockCreate.mockResolvedValue({
      id: 3,
      title: 'New Title',
      author: 'Author',
      isbn: '123',
      publication_year: 2020,
      available: true,
    });

    render(<ManageBooksPage />);
    await waitFor(() => screen.getByText('Atomic Habits'));

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'New Title');
    await user.clear(screen.getByLabelText('Author'));
    await user.type(screen.getByLabelText('Author'), 'Author');
    await user.clear(screen.getByLabelText('ISBN'));
    await user.type(screen.getByLabelText('ISBN'), '123');
    await user.clear(screen.getByLabelText('Publication Year'));
    await user.type(screen.getByLabelText('Publication Year'), '2020');
    await user.click(screen.getByRole('button', { name: /create book/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'New Title',
        author: 'Author',
        isbn: '123',
        publication_year: 2020,
        available: true,
      });
    });
  });

  it('edits a book and saves changes', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });
    mockUpdate.mockResolvedValue(mockBookPaginatedResponse().data[0]);

    render(<ManageBooksPage />);
    await waitFor(() => screen.getByText('Atomic Habits'));

    const user = userEvent.setup();
    await user.click(screen.getAllByText(/Edit/)[0]);
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Atomic Habits (Updated)');
    await user.click(screen.getByRole('button', { name: /update book/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        title: 'Atomic Habits (Updated)',
        author: 'James Clear',
        publication_year: 2018,
      });
    });
  });

  it('deletes a book when confirmed', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockRemove.mockResolvedValue(undefined);

    render(<ManageBooksPage />);
    await waitFor(() => screen.getByText('Atomic Habits'));

    const user = userEvent.setup();
    await user.click(screen.getAllByText(/Delete/)[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalledWith(1);
    });

    confirmSpy.mockRestore();
  });
});
