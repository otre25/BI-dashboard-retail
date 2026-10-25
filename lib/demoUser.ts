import type { Company, User } from '../types/auth.types';

// Account di sola lettura per la demo pubblica: non passa da Supabase.
export const DEMO_USER: User = {
  id: 'demo-guest',
  email: 'ospite@demo.local',
  name: 'Ospite',
  role: 'viewer',
  companyId: 'demo-company',
  createdAt: new Date(0),
};

export const DEMO_COMPANY: Company = {
  id: 'demo-company',
  name: 'Retail Demo',
  industry: 'retail',
  createdAt: new Date(0),
  settings: {
    currency: 'EUR',
    timezone: 'Europe/Rome',
    fiscalYearStart: '01-01',
    defaultDateRange: 30,
  },
};

export const isDemoUser = (user: User | null): boolean => user?.id === DEMO_USER.id;
