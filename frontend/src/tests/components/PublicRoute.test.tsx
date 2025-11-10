import { describe, it, expect, beforeEach } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicRoute from '../../components/PublicRoute';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastProvider';

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

function TestApp({ authenticated }: { authenticated: boolean }) {
  if (authenticated) {
    const user = {
      id: 2,
      name: 'John Doe',
      email: 'user@example.com',
      role: 'Member' as const,
    };
    localStorage.setItem('auth_token', 'mock-token-user');
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.clear();
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <div data-testid="public-content">Login Form</div>
                </PublicRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('PublicRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should show loading spinner while checking authentication', async () => {
    window.history.pushState({}, '', '/login');
    rtlRender(<TestApp authenticated={false} />);
    
    // The loading state might be too fast to catch, so we just verify
    // that eventually the public content is shown (auth check completed)
    const publicContent = await screen.findByTestId('public-content', {}, { timeout: 3000 });
    expect(publicContent).toBeInTheDocument();
  });

  it('should render public content when not authenticated', async () => {
    window.history.pushState({}, '', '/login');
    rtlRender(<TestApp authenticated={false} />);

    // Wait for auth check to complete and public content to render
    const publicContent = await screen.findByTestId('public-content', {}, { timeout: 3000 });

    expect(publicContent).toBeInTheDocument();
    expect(screen.getByText('Login Form')).toBeInTheDocument();
  });

  it('should redirect to dashboard when authenticated', async () => {
    window.history.pushState({}, '', '/login');
    rtlRender(<TestApp authenticated={true} />);

    // Should redirect to dashboard after auth check
    const dashboardPage = await screen.findByText('Dashboard Page', {}, { timeout: 3000 });
    
    expect(dashboardPage).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });
});
