import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageUsersPage from '../../components/ManageUsersPage';

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

vi.mock('@/services/userService', () => ({
  userService: {
    list: (...args: unknown[]) => mockList(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

const mockPaginatedResponse = () => ({
  data: [
    {
      id: 10,
      name: 'Ava Analyst',
      email: 'ava@example.com',
      role: 'Admin' as const,
      library_id: 'LIB-1001',
    },
    {
      id: 11,
      name: 'Ben Borrower',
      email: 'ben@example.com',
      role: 'User' as const,
      library_id: 'LIB-1002',
    },
  ],
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '/api/users',
    per_page: 10,
    to: 2,
    total: 2,
  },
});

describe('ManageUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(mockPaginatedResponse());
  });

  it('shows restricted message for non-admin users', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'User' } });

    render(<ManageUsersPage />);

    expect(await screen.findByText('Admin access required')).toBeInTheDocument();
    expect(
      screen.getByText(/Manage users is only available for admins/i)
    ).toBeInTheDocument();
  });

  it('renders directory and summary for admins', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Ava Analyst')).toBeInTheDocument();
      expect(screen.getByText('Ben Borrower')).toBeInTheDocument();
    });

    expect(screen.getByText(/Total users/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText(/Admins/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Members/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Edit/)).toHaveLength(2);
  });

  it('submits create form for new user', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });
    mockCreate.mockResolvedValue({
      id: 12,
      name: 'New User',
      email: 'new@example.com',
      role: 'User',
    });

    render(<ManageUsersPage />);

    await waitFor(() => screen.getByText('Ava Analyst'));

    const user = userEvent.setup();
    await user.clear(screen.getByTestId('form-input-name'));
    await user.type(screen.getByTestId('form-input-name'), 'New User');

    await user.clear(screen.getByTestId('form-input-email'));
    await user.type(screen.getByTestId('form-input-email'), 'new@example.com');

    await user.selectOptions(screen.getByLabelText('Role'), 'User');
    await user.type(screen.getByTestId('form-input-password'), 'secret123');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'secret123',
        role: 'User',
      });
    });
  });

  it('enters edit mode and updates user', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });
    mockUpdate.mockResolvedValue({
      id: 10,
      name: 'Ava Analyst',
      email: 'ava@example.com',
      role: 'Admin',
    });

    render(<ManageUsersPage />);
    await waitFor(() => screen.getByText('Ava Analyst'));

    const user = userEvent.setup();
    await user.click(screen.getAllByText(/Edit/)[0]);

    await user.clear(screen.getByTestId('form-input-name'));
    await user.type(screen.getByTestId('form-input-name'), 'Ava Ops');
    await user.click(screen.getByRole('button', { name: /update user/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(10, {
        name: 'Ava Ops',
        email: 'ava@example.com',
        role: 'Admin',
      });
    });
  });

  it('deletes a user when confirmed', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'Admin' } });
    mockRemove.mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ManageUsersPage />);
    await waitFor(() => screen.getByText('Ava Analyst'));

    const user = userEvent.setup();
    await user.click(screen.getAllByText(/Delete/)[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalledWith(10);
    });

    confirmSpy.mockRestore();
  });
});
