import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { rolePermissions } from '../types/auth.types';
import type { Permissions } from '../types/auth.types';

export function useAuth() {
  const { user, company, isAuthenticated, isLoading, checkAuth, login, logout } = useAuthStore();

  // Check auth on mount
  useEffect(() => {
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await checkAuth();
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().setUser(null, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Get permissions for current user
  const permissions: Permissions | null = user ? rolePermissions[user.role] : null;

  return {
    user,
    company,
    isAuthenticated,
    isLoading,
    permissions,
    login,
    logout,
    checkAuth,
  };
}
