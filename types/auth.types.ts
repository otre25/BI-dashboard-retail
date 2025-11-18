// Authentication and Authorization Types

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  createdAt: Date;
  lastLogin?: Date;
  avatarUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  createdAt: Date;
  settings: CompanySettings;
}

export interface CompanySettings {
  currency: string;
  timezone: string;
  fiscalYearStart: string; // MM-DD format
  defaultDateRange: number; // days
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName: string;
  industry: string;
}

export interface AuthResponse {
  user: User;
  company: Company;
  accessToken: string;
  refreshToken: string;
}

// Role-based permissions
export interface Permissions {
  canViewDashboard: boolean;
  canEditSettings: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canManageBudget: boolean;
  canAccessAPI: boolean;
  canViewReports: boolean;
}

export const rolePermissions: Record<UserRole, Permissions> = {
  admin: {
    canViewDashboard: true,
    canEditSettings: true,
    canManageUsers: true,
    canExportData: true,
    canManageBudget: true,
    canAccessAPI: true,
    canViewReports: true,
  },
  manager: {
    canViewDashboard: true,
    canEditSettings: false,
    canManageUsers: false,
    canExportData: true,
    canManageBudget: true,
    canAccessAPI: false,
    canViewReports: true,
  },
  viewer: {
    canViewDashboard: true,
    canEditSettings: false,
    canManageUsers: false,
    canExportData: false,
    canManageBudget: false,
    canAccessAPI: false,
    canViewReports: true,
  },
};
