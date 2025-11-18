import { create } from 'zustand';
import type { User, Company, AuthState, LoginCredentials } from '../types/auth.types';
import { authService } from '../services/authService';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null, company: Company | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    console.log('[AuthStore] Login attempt for:', credentials.email);
    try {
      const { user, company } = await authService.login(credentials);
      console.log('[AuthStore] Login successful:', { user, company });
      set({
        user,
        company,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('[AuthStore] Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      set({
        user: null,
        company: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  checkAuth: async () => {
    console.log('[AuthStore] checkAuth called');
    try {
      set({ isLoading: true });

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 10000)
      );

      const result = await Promise.race([
        authService.getCurrentUser(),
        timeoutPromise
      ]) as { user: User; company: Company } | null;

      console.log('[AuthStore] Auth check result:', result);

      if (result) {
        set({
          user: result.user,
          company: result.company,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[AuthStore] Check auth error:', error);
      set({
        user: null,
        company: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user, company) => {
    set({
      user,
      company,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
}));
