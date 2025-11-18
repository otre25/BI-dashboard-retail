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
    try {
      const { user, company } = await authService.login(credentials);
      set({
        user,
        company,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
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
    try {
      set({ isLoading: true });
      const result = await authService.getCurrentUser();

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
      console.error('Check auth error:', error);
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
