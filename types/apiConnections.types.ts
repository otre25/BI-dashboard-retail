// API Connection types for advertising platforms

export type PlatformType = 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'ga4';

export interface ApiCredentials {
  id: string;
  platform: PlatformType;
  companyId: string;
  credentials: MetaAdsCredentials | GoogleAdsCredentials | TikTokAdsCredentials | GA4Credentials;
  isActive: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  syncInterval: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

// Meta Ads (Facebook/Instagram)
export interface MetaAdsCredentials {
  accessToken: string;
  adAccountId: string;
  appId?: string;
  appSecret?: string;
}

export interface MetaAdsData {
  date: string;
  campaign_id: string;
  campaign_name: string;
  ad_set_id: string;
  ad_set_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// Google Ads
export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string; // Google Ads customer ID
  developerToken: string;
}

export interface GoogleAdsData {
  date: string;
  campaign_id: string;
  campaign_name: string;
  ad_group_id: string;
  ad_group_name: string;
  cost_micros: number; // Google uses micros (1/1,000,000)
  impressions: number;
  clicks: number;
  conversions: number;
  conversions_value: number;
}

// TikTok Ads
export interface TikTokAdsCredentials {
  accessToken: string;
  advertiserId: string;
  appId?: string;
  secret?: string;
}

export interface TikTokAdsData {
  date: string;
  campaign_id: string;
  campaign_name: string;
  adgroup_id: string;
  adgroup_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_value: number;
}

// Google Analytics 4
export interface GA4Credentials {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
  projectId?: string;
}

export interface GA4Data {
  date: string;
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  users: number;
  newUsers: number;
  conversions: number;
  revenue: number;
  transactions: number;
}

// Unified data format
export interface SyncedAdData {
  id: string;
  companyId: string;
  platform: PlatformType;
  date: Date;
  campaignId: string;
  campaignName: string;
  adSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpa: number; // Cost per acquisition
  roas: number; // Return on ad spend
  rawData: Record<string, any>; // Original data from platform
  syncedAt: Date;
}

// Sync status
export interface SyncStatus {
  id: string;
  platform: PlatformType;
  companyId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: Date | null;
  nextSync: Date | null;
  syncInterval: number;
  recordsSynced: number;
  error?: string;
  progress?: number; // 0-100
}

// Sync configuration
export interface SyncConfig {
  enabled: boolean;
  interval: number; // minutes (default: 30)
  dateRange: {
    from: Date;
    to: Date;
  };
  platforms: PlatformType[];
  autoRetry: boolean;
  maxRetries: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

// Connection test result
export interface ConnectionTestResult {
  platform: PlatformType;
  success: boolean;
  message: string;
  accountInfo?: {
    name: string;
    id: string;
    currency: string;
  };
  error?: string;
}

// Sync log entry
export interface SyncLog {
  id: string;
  platform: PlatformType;
  companyId: string;
  status: 'started' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  error?: string;
  details?: Record<string, any>;
}
