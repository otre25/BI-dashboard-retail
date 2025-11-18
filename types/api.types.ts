// API Response Types for Advertising Channels

export interface MetaAdsMetrics {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversion_value: number;
  date_start: string;
  date_stop: string;
}

export interface GoogleAdsMetrics {
  campaign_id: string;
  campaign_name: string;
  cost_micros: number; // Google uses micros (1/1,000,000 of currency)
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_value: number;
  ctr: number;
  average_cpc: number;
  date: string;
}

export interface TikTokAdsMetrics {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  conversion_value: number;
  stat_time_day: string;
}

export interface LinkedInAdsMetrics {
  campaign_id: string;
  campaign_name: string;
  cost_in_local_currency: number;
  impressions: number;
  clicks: number;
  conversions: number;
  external_website_conversions: number;
  date_range: {
    start: string;
    end: string;
  };
}

// Normalized advertising data structure
export interface NormalizedAdData {
  channel: 'meta' | 'google' | 'tiktok' | 'linkedin' | 'other';
  campaign_id: string;
  campaign_name: string;
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_value: number;
  ctr: number;
  cpc: number;
  roas: number;
  store_id?: number; // Optional: link to specific store
}

// API Configuration
export interface ChannelApiConfig {
  channel: 'meta' | 'google' | 'tiktok' | 'linkedin';
  enabled: boolean;
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    accountId?: string;
  };
  lastSync?: Date;
  syncInterval?: number; // in minutes
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  source: 'api' | 'cache' | 'mock';
}

// Sync status
export interface SyncStatus {
  channel: string;
  lastSync: Date | null;
  nextSync: Date | null;
  status: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
  recordsProcessed?: number;
}
