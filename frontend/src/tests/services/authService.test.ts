import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/authService';
import type { AuthResponse } from '@/types/auth';
import { api } from '@/config/axios';

vi.mock('@/config/axios', () => {
  return {
    api: {
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

const mockResponse = (overrides: Partial<AuthResponse> = {}): AuthResponse => ({
  token: 'mock-token',
  user: {
    id: 1,
    name: 'Default Admin',
    email: 'admin@admin.com',
    role: 'Admin',
  },
  ...overrides,
});

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('stores token on login', async () => {
    (api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockResponse({ token: 'login-token' }),
    });

    const result = await authService.login({ email: 'admin@admin.com', password: 'secret' });

    expect(api.post).toHaveBeenCalledWith('/login', { email: 'admin@admin.com', password: 'secret' });
    expect(localStorage.getItem('auth_token')).toBe('login-token');
    expect(result.token).toBe('login-token');
  });

  it('stores token on register', async () => {
    (api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockResponse({ token: 'register-token' }),
    });

    await authService.register({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      role: 'User',
    });

    expect(api.post).toHaveBeenCalledWith('/register', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      role: 'User',
    });
    expect(localStorage.getItem('auth_token')).toBe('register-token');
  });

  it('clears token on logout even if request succeeds', async () => {
    localStorage.setItem('auth_token', 'existing-token');
    (api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    await authService.logout();

    expect(api.post).toHaveBeenCalledWith('/logout');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('returns current user data', async () => {
    const payload = mockResponse();
    (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: payload });

    const user = await authService.getCurrentUser();

    expect(api.get).toHaveBeenCalledWith('/me');
    expect(user).toEqual(payload);
  });

  it('exposes helpers for token management', () => {
    expect(authService.isAuthenticated()).toBe(false);

    localStorage.setItem('auth_token', 'helper-token');
    expect(authService.getToken()).toBe('helper-token');
    expect(authService.isAuthenticated()).toBe(true);

    authService.clearAuth();
    expect(authService.getToken()).toBeNull();
  });
});
