import { create } from 'zustand';
import type { User, Company, AuthState, LoginCredentials } from '../types/auth.types';
import { authService } from '../services/authService';

interface AuthStore extends AuthState {
  isGuest: boolean;
  loginAsGuest: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null, company: Company | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: false, // Start with false for faster initial render
  isGuest: false,

  // Sessione ospite: solo in memoria, nessuna chiamata a Supabase, sola lettura.
  loginAsGuest: () => {
    set({
      user: {
        id: 'guest',
        email: 'ospite@demo.local',
        name: 'Ospite',
        role: 'viewer',
        companyId: 'guest-company',
        createdAt: new Date(),
      },
      company: {
        id: 'guest-company',
        name: 'Cucine Retail (demo)',
        industry: 'retail',
        createdAt: new Date(),
        settings: {
          currency: 'EUR',
          timezone: 'Europe/Rome',
          fiscalYearStart: '01-01',
          defaultDateRange: 30,
        },
      },
      isAuthenticated: true,
      isGuest: true,
      isLoading: false,
    });
  },

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
      if (!useAuthStore.getState().isGuest) {
        await authService.logout();
      }
      set({
        user: null,
        company: null,
        isAuthenticated: false,
        isGuest: false,
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
      // Don't set loading to true - keep UI responsive

      // Add aggressive timeout for faster initial load
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
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
      // On timeout or error, assume not authenticated
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
