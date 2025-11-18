import { supabase } from '../lib/supabase';
import type { LoginCredentials, RegisterData, User, Company, AuthResponse } from '../types/auth.types';

export class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    // Fetch user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      companyId: userData.company_id,
      createdAt: new Date(userData.created_at),
      lastLogin: userData.last_login ? new Date(userData.last_login) : undefined,
      avatarUrl: userData.avatar_url,
    };

    const company: Company = {
      id: userData.companies.id,
      name: userData.companies.name,
      industry: userData.companies.industry,
      createdAt: new Date(userData.companies.created_at),
      settings: {
        currency: userData.companies.currency,
        timezone: userData.companies.timezone,
        fiscalYearStart: userData.companies.fiscal_year_start,
        defaultDateRange: userData.companies.default_date_range,
      },
    };

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    return {
      user,
      company,
      accessToken: authData.session!.access_token,
      refreshToken: authData.session!.refresh_token,
    };
  }

  /**
   * Register new user and company
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');

    // Create company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: data.companyName,
        industry: data.industry,
      })
      .select()
      .single();

    if (companyError) throw companyError;

    // Create user in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: 'admin', // First user is always admin
        company_id: companyData.id,
      })
      .select()
      .single();

    if (userError) throw userError;

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      companyId: userData.company_id,
      createdAt: new Date(userData.created_at),
    };

    const company: Company = {
      id: companyData.id,
      name: companyData.name,
      industry: companyData.industry,
      createdAt: new Date(companyData.created_at),
      settings: {
        currency: companyData.currency,
        timezone: companyData.timezone,
        fiscalYearStart: companyData.fiscal_year_start,
        defaultDateRange: companyData.default_date_range,
      },
    };

    return {
      user,
      company,
      accessToken: authData.session!.access_token,
      refreshToken: authData.session!.refresh_token,
    };
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  /**
   * Get current user with company
   */
  async getCurrentUser(): Promise<{ user: User; company: Company } | null> {
    console.log('[AuthService] Getting current user...');
    const session = await this.getCurrentSession();
    if (!session) {
      console.log('[AuthService] No session found');
      return null;
    }

    console.log('[AuthService] Session found, fetching user data for:', session.user.id);
    const { data: userData, error } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('[AuthService] Error fetching user:', error);
      throw error;
    }

    if (!userData) {
      console.error('[AuthService] No user data found');
      return null;
    }

    console.log('[AuthService] User data fetched successfully:', userData);

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      companyId: userData.company_id,
      createdAt: new Date(userData.created_at),
      lastLogin: userData.last_login ? new Date(userData.last_login) : undefined,
      avatarUrl: userData.avatar_url,
    };

    // Handle case where company data might not be loaded
    if (!userData.companies) {
      console.warn('[AuthService] No company data found, creating default company');
      const company: Company = {
        id: userData.company_id || 'default',
        name: 'Demo Company',
        industry: 'retail',
        createdAt: new Date(),
        settings: {
          currency: 'EUR',
          timezone: 'Europe/Rome',
          fiscalYearStart: '01-01',
          defaultDateRange: '30d',
        },
      };
      return { user, company };
    }

    const company: Company = {
      id: userData.companies.id,
      name: userData.companies.name,
      industry: userData.companies.industry,
      createdAt: new Date(userData.companies.created_at),
      settings: {
        currency: userData.companies.currency,
        timezone: userData.companies.timezone,
        fiscalYearStart: userData.companies.fiscal_year_start,
        defaultDateRange: userData.companies.default_date_range,
      },
    };

    return { user, company };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
