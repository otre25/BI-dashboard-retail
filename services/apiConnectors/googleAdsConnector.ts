// Google Ads API Connector

import type {
  GoogleAdsCredentials,
  GoogleAdsData,
  SyncedAdData,
  ApiResponse,
  ConnectionTestResult,
} from '../../types/apiConnections.types';

const GOOGLE_ADS_API_VERSION = 'v15';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

/**
 * Tests Google Ads connection
 */
export async function testGoogleAdsConnection(
  credentials: GoogleAdsCredentials
): Promise<ConnectionTestResult> {
  try {
    // First, exchange refresh token for access token
    const accessToken = await getAccessToken(credentials);
    if (!accessToken) {
      return {
        platform: 'google_ads',
        success: false,
        message: 'Impossibile ottenere access token',
        error: 'Token refresh failed',
      };
    }

    // Test connection by fetching customer info
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code
      FROM customer
      LIMIT 1
    `;

    const response = await fetch(
      `${GOOGLE_ADS_BASE_URL}/customers/${credentials.customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': credentials.developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        platform: 'google_ads',
        success: false,
        message: 'Connessione fallita',
        error: error.error?.message || 'Unknown error',
      };
    }

    const data = await response.json();
    const customer = data.results?.[0]?.customer;

    return {
      platform: 'google_ads',
      success: true,
      message: 'Connessione riuscita',
      accountInfo: {
        name: customer?.descriptiveName || 'Unknown',
        id: customer?.id?.toString() || credentials.customerId,
        currency: customer?.currencyCode || 'USD',
      },
    };
  } catch (error) {
    return {
      platform: 'google_ads',
      success: false,
      message: 'Errore di connessione',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets OAuth access token from refresh token
 */
async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Google Ads token');
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Google Ads token:', error);
    return null;
  }
}

/**
 * Fetches Google Ads data for a date range
 */
export async function fetchGoogleAdsData(
  credentials: GoogleAdsCredentials,
  dateFrom: Date,
  dateTo: Date
): Promise<ApiResponse<GoogleAdsData[]>> {
  try {
    const accessToken = await getAccessToken(credentials);
    if (!accessToken) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to obtain access token',
        },
      };
    }

    const dateFromStr = dateFrom.toISOString().split('T')[0].replace(/-/g, '');
    const dateToStr = dateTo.toISOString().split('T')[0].replace(/-/g, '');

    // Google Ads Query Language (GAQL)
    const query = `
      SELECT
        segments.date,
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date >= '${dateFromStr}'
        AND segments.date <= '${dateToStr}'
        AND campaign.status = 'ENABLED'
      ORDER BY segments.date DESC
    `;

    const response = await fetch(
      `${GOOGLE_ADS_BASE_URL}/customers/${credentials.customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': credentials.developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, pageSize: 10000 }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'GOOGLE_ADS_API_ERROR',
          message: error.error?.message || 'Failed to fetch data',
          details: error,
        },
      };
    }

    const result = await response.json();

    // Transform Google Ads data
    const transformedData: GoogleAdsData[] = (result.results || []).map((item: any) => ({
      date: formatGoogleAdsDate(item.segments?.date),
      campaign_id: item.campaign?.id?.toString() || '',
      campaign_name: item.campaign?.name || '',
      ad_group_id: item.adGroup?.id?.toString() || '',
      ad_group_name: item.adGroup?.name || '',
      cost_micros: parseInt(item.metrics?.costMicros || 0),
      impressions: parseInt(item.metrics?.impressions || 0),
      clicks: parseInt(item.metrics?.clicks || 0),
      conversions: parseFloat(item.metrics?.conversions || 0),
      conversions_value: parseFloat(item.metrics?.conversionsValue || 0),
    }));

    return {
      success: true,
      data: transformedData,
      pagination: {
        hasMore: !!result.nextPageToken,
        nextCursor: result.nextPageToken,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Formats Google Ads date (YYYYMMDD) to YYYY-MM-DD
 */
function formatGoogleAdsDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

/**
 * Transforms Google Ads data to unified format
 */
export function transformGoogleAdsToUnified(
  data: GoogleAdsData[],
  companyId: string
): SyncedAdData[] {
  return data.map((item) => {
    const clicks = item.clicks || 0;
    const impressions = item.impressions || 0;
    const spend = item.cost_micros / 1000000; // Convert micros to currency
    const conversions = item.conversions || 0;
    const revenue = item.conversions_value || 0;

    return {
      id: `google_${item.campaign_id}_${item.date}`,
      companyId,
      platform: 'google_ads',
      date: new Date(item.date),
      campaignId: item.campaign_id,
      campaignName: item.campaign_name,
      adSpend: spend,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? revenue / spend : 0,
      rawData: item,
      syncedAt: new Date(),
    };
  });
}

/**
 * Gets available campaigns
 */
export async function getGoogleAdsCampaigns(
  credentials: GoogleAdsCredentials
): Promise<ApiResponse<{ id: string; name: string; status: string }[]>> {
  try {
    const accessToken = await getAccessToken(credentials);
    if (!accessToken) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to obtain access token',
        },
      };
    }

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status
      FROM campaign
      ORDER BY campaign.name
    `;

    const response = await fetch(
      `${GOOGLE_ADS_BASE_URL}/customers/${credentials.customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': credentials.developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'GOOGLE_ADS_API_ERROR',
          message: error.error?.message || 'Failed to fetch campaigns',
        },
      };
    }

    const result = await response.json();

    const campaigns = (result.results || []).map((item: any) => ({
      id: item.campaign?.id?.toString() || '',
      name: item.campaign?.name || '',
      status: item.campaign?.status || '',
    }));

    return {
      success: true,
      data: campaigns,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Validates Google Ads credentials format
 */
export function validateGoogleAdsCredentials(credentials: Partial<GoogleAdsCredentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.clientId) {
    errors.push('Client ID è richiesto');
  }

  if (!credentials.clientSecret) {
    errors.push('Client Secret è richiesto');
  }

  if (!credentials.refreshToken) {
    errors.push('Refresh Token è richiesto');
  }

  if (!credentials.customerId) {
    errors.push('Customer ID è richiesto');
  } else if (!/^\d{10}$/.test(credentials.customerId.replace(/-/g, ''))) {
    errors.push('Customer ID deve essere di 10 cifre');
  }

  if (!credentials.developerToken) {
    errors.push('Developer Token è richiesto');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
