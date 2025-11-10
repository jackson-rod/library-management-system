import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import NavigationBar from '../../components/NavigationBar';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

function renderWithUser(userRole: 'Admin' | 'Member') {
  const user = {
    id: userRole === 'Admin' ? 1 : 2,
    name: userRole === 'Admin' ? 'Default Admin' : 'John Doe',
    email: userRole === 'Admin' ? 'admin@admin.com' : 'user@example.com',
    role: userRole,
  };

  const token = userRole === 'Admin' ? 'mock-token-admin' : 'mock-token-user';
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));

  return render(<NavigationBar />);
}

describe('NavigationBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render navigation bar', async () => {
    renderWithUser('Member');

    // Wait for auth to load
    await waitFor(() => {
      expect(screen.getByTestId('navbar-logo')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Library Management System')).toBeInTheDocument();
  });

  it('should show user initial in profile button', async () => {
    renderWithUser('Admin');

    // Wait for auth to load
    const profileButton = await screen.findByTestId('profile-menu-button');
    expect(profileButton).toBeInTheDocument();
    
    // The button contains both sr-only text and the visible initial
    expect(profileButton.textContent).toContain('D'); // 'D' from 'Default Admin'
  });

  it('should display navigation links for regular user', async () => {
    renderWithUser('Member');

    // Wait for auth to load
    await waitFor(() => {
      expect(screen.getByTestId('nav-link-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('nav-link-books')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-my-borrowings')).toBeInTheDocument();
  });

  it('should display admin-only links for admin user', async () => {
    renderWithUser('Admin');

    // Wait for auth to load
    await waitFor(() => {
      expect(screen.getByTestId('nav-link-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('nav-link-manage-books')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-manage-users')).toBeInTheDocument();
  });

  it('should not show admin links for regular user', async () => {
    renderWithUser('Member');

    // Wait for auth to load
    await waitFor(() => {
      expect(screen.getByTestId('nav-link-dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('nav-link-manage-books')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-link-manage-users')).not.toBeInTheDocument();
  });

  it('should open profile menu when profile button is clicked', async () => {
    const user = userEvent.setup();
    renderWithUser('Admin');

    const profileButton = screen.getByTestId('profile-menu-button');
    await user.click(profileButton);

    await waitFor(() => {
      expect(screen.getByTestId('profile-menu')).toBeInTheDocument();
    });
  });

  it('should display user information in profile menu', async () => {
    const user = userEvent.setup();
    renderWithUser('Admin');

    // Wait for auth to load
    const profileButton = await screen.findByTestId('profile-menu-button');
    await user.click(profileButton);

    await waitFor(() => {
      expect(screen.getByText('Default Admin')).toBeInTheDocument();
      expect(screen.getByText('admin@admin.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('should close profile menu when backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderWithUser('Member');

    // Wait for auth to load
    const profileButton = await screen.findByTestId('profile-menu-button');
    await user.click(profileButton);

    await waitFor(() => {
      expect(screen.getByTestId('profile-menu')).toBeInTheDocument();
    });

    // Click backdrop (the first child of the menu's parent)
    const backdrop = screen.getByTestId('profile-menu').previousElementSibling;
    if (backdrop) {
      await user.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByTestId('profile-menu')).not.toBeInTheDocument();
    });
  });

  it('should have profile link in menu', async () => {
    const user = userEvent.setup();
    renderWithUser('Member');

    // Wait for auth to load then click profile button
    const profileButton = await screen.findByTestId('profile-menu-button');
    await user.click(profileButton);

    await waitFor(() => {
      expect(screen.getByTestId('profile-link')).toBeInTheDocument();
    });
  });

  it('should have sign out button in profile menu', async () => {
    const user = userEvent.setup();
    renderWithUser('Member');

    // Wait for auth to load then click profile button
    const profileButton = await screen.findByTestId('profile-menu-button');
    await user.click(profileButton);

    await waitFor(() => {
      expect(screen.getByTestId('signout-button')).toBeInTheDocument();
    });
  });

  it('should toggle mobile menu', async () => {
    const user = userEvent.setup();
    renderWithUser('Member');

    // Wait for auth to load
    const mobileMenuButton = await screen.findByTestId('mobile-menu-button');
    await user.click(mobileMenuButton);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });

    await user.click(mobileMenuButton);

    await waitFor(() => {
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
  });

  it('should display navigation links in mobile menu', async () => {
    const user = userEvent.setup();
    renderWithUser('Member');

    // Wait for auth to load
    const mobileMenuButton = await screen.findByTestId('mobile-menu-button');
    await user.click(mobileMenuButton);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-nav-link-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-link-books')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-nav-link-my-borrowings')).toBeInTheDocument();
    });
  });

  it('should have disabled notifications button', async () => {
    renderWithUser('Member');

    // Wait for auth to load
    const notificationsButton = await screen.findByTestId('notifications-button');
    expect(notificationsButton).toBeDisabled();
  });
});
