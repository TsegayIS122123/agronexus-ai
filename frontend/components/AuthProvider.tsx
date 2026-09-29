'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, type LoginRequest, type RegisterRequest } from '@/features/auth/api';
import { useLocale } from './LocaleProvider';

interface AuthState {
  user: AuthUser | null;
  role: 'farmer' | 'processor' | 'consumer' | null;
  loading: boolean;
  error: string | null;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  role: string;
  createdAt: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
    error: null,
  });
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Locale is consumed by Header; keep this import available if needed later.
  // const { locale } = useLocale();

  const fetchUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await authApi.me();
      setState({
        user: data.user as AuthUser,
        role: (data.user as AuthUser).role as AuthState['role'],
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        user: null,
        role: null,
        loading: false,
        error: 'auth_error',
      }));
    }
  }, []);

  useEffect(() => {
    fetchUser();
    const interval = setInterval(fetchUser, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await authApi.login({
          email,
          password,
        } as LoginRequest);
        setState({
          user: response.user as AuthUser,
          role: (response.user as AuthUser).role as AuthState['role'],
          loading: false,
          error: null,
        });
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'auth_error',
        }));
        return false;
      }
    },
    []
  );

  const register = useCallback(
    async (data: RegisterRequest): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await authApi.register(data);
        setState({
          user: response.user as AuthUser,
          role: (response.user as AuthUser).role as AuthState['role'],
          loading: false,
          error: null,
        });
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'auth_error',
        }));
        return false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setState({
      user: null,
      role: null,
      loading: false,
      error: null,
    });
    // Keep the stored locale; only auth data is cleared.
  }, []);

  const refresh = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
