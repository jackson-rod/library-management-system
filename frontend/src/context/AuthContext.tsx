import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

import { authService } from '../services/authService';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import { AuthContext, type AuthContextType } from './auth.context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();

      if (token) {
        try {
          // Validate token and fetch user data from API
          const response = await authService.getCurrentUser();
          setUser(response.user);
        } catch {
          // Token is invalid, clear it
          authService.clearAuth();
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    const response = await authService.register(userData);
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
