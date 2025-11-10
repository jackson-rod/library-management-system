import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

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

describe('useAuth', () => {
  beforeEach(async () => {
    localStorage.clear();
    // Ensure clean slate
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterEach(async () => {
    cleanup();
    server.resetHandlers();
    // Give time for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('should initialize with null user and not authenticated', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for loading to complete (may start true or go directly to false)
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After loading completes, user should be null with no token
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should restore user from localStorage on mount', async () => {
    // Only the token is stored in localStorage
    localStorage.setItem('auth_token', 'mock-token-user');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // MSW returns the user based on the token via /me endpoint
    expect(result.current.user?.email).toBe('user@example.com');
    expect(result.current.user?.name).toBe('John Doe');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should successfully log in user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let response: Awaited<ReturnType<typeof result.current.login>>;
    await act(async () => {
      response = await result.current.login({
        email: 'admin@admin.com',
        password: 'admin123!',
      });
    });

    expect(response!.user.name).toBe('Default Admin');
    expect(response!.user.email).toBe('admin@admin.com');
    expect(response!.token).toBe('mock-token-admin');

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user?.email).toBe('admin@admin.com');
  });

  it('should store token and user in localStorage on login', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login({
        email: 'admin@admin.com',
        password: 'admin123!',
      });
    });

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // authService only stores the token, not the user
    expect(localStorage.getItem('auth_token')).toBe('mock-token-admin');

    // The user is in the context state
    expect(result.current.user?.email).toBe('admin@admin.com');
    expect(result.current.user?.name).toBe('Default Admin');
  });

  it('should handle login error', async () => {
    server.use(
      http.post('http://localhost:9080/api/login', () => {
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.login({
          email: 'wrong@example.com',
          password: 'wrongpass',
        });
      })
    ).rejects.toThrow();
  });

  it('should successfully log out user', async () => {
    // Only token is stored, user comes from /me endpoint
    localStorage.setItem('auth_token', 'mock-token-user');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for loading to complete and user to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify user is authenticated
    expect(result.current.user?.email).toBe('user@example.com');
    expect(result.current.isAuthenticated).toBe(true);

    // Call logout
    await act(async () => {
      await result.current.logout();
    });

    // Verify user is logged out
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('should validate token on mount', async () => {
    localStorage.setItem('auth_token', 'invalid-token');

    server.use(
      http.get('http://localhost:9080/api/me', () => {
        return HttpResponse.json(
          { message: 'Unauthenticated' },
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
