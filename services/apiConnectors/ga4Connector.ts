// Google Analytics 4 API Connector

import type {
  GA4Credentials,
  GA4Data,
  SyncedAdData,
  ApiResponse,
  ConnectionTestResult,
} from '../../types/apiConnections.types';

const GA4_BASE_URL = 'https://analyticsdata.googleapis.com/v1beta';

/**
 * Tests GA4 connection
 */
export async function testGA4Connection(
  credentials: GA4Credentials
): Promise<ConnectionTestResult> {
  try {
    const accessToken = await getGA4AccessToken(credentials);
    if (!accessToken) {
      return {
        platform: 'ga4',
        success: false,
        message: 'Impossibile ottenere access token',
        error: 'Authentication failed',
      };
    }

    // Test connection with a simple metadata request
    const response = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${credentials.propertyId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        platform: 'ga4',
        success: false,
        message: 'Connessione fallita',
        error: error.error?.message || 'Unknown error',
      };
    }

    const data = await response.json();

    return {
      platform: 'ga4',
      success: true,
      message: 'Connessione riuscita',
      accountInfo: {
        name: data.displayName || 'GA4 Property',
        id: credentials.propertyId,
        currency: data.currencyCode || 'EUR',
      },
    };
  } catch (error) {
    return {
      platform: 'ga4',
      success: false,
      message: 'Errore di connessione',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets OAuth access token using service account
 */
async function getGA4AccessToken(credentials: GA4Credentials): Promise<string | null> {
  try {
    // Create JWT for service account
    const jwt = await createServiceAccountJWT(credentials);
    if (!jwt) return null;

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get GA4 access token');
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting GA4 access token:', error);
    return null;
  }
}

/**
 * Creates JWT for service account authentication
 * Note: In production, this should be done server-side for security
 */
async function createServiceAccountJWT(credentials: GA4Credentials): Promise<string | null> {
  try {
    // This is a simplified version - in production, use a proper JWT library
    // and handle this server-side
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.clientEmail,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Note: This requires proper RSA signing implementation
    // In a real app, this should be handled by the backend
    console.warn('JWT signing should be implemented server-side');
    return null;
  } catch (error) {
    console.error('Error creating JWT:', error);
    return null;
  }
}

/**
 * Fetches GA4 data for a date range
 */
export async function fetchGA4Data(
  credentials: GA4Credentials,
  dateFrom: Date,
  dateTo: Date
): Promise<ApiResponse<GA4Data[]>> {
  try {
    const accessToken = await getGA4AccessToken(credentials);
    if (!accessToken) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to obtain access token',
        },
      };
    }

    const startDate = dateFrom.toISOString().split('T')[0];
    const endDate = dateTo.toISOString().split('T')[0];

    // GA4 Data API request
    const requestBody = {
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'date' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
        { name: 'transactions' },
      ],
      limit: 10000,
      orderBys: [
        {
          dimension: { dimensionName: 'date' },
          desc: true,
        },
      ],
    };

    const response = await fetch(
      `${GA4_BASE_URL}/properties/${credentials.propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'GA4_API_ERROR',
          message: error.error?.message || 'Failed to fetch data',
          details: error,
        },
      };
    }

    const result = await response.json();

    // Transform GA4 data
    const transformedData: GA4Data[] = (result.rows || []).map((row: any) => ({
      date: row.dimensionValues[0]?.value || '',
      source: row.dimensionValues[1]?.value || '(direct)',
      medium: row.dimensionValues[2]?.value || '(none)',
      campaign: row.dimensionValues[3]?.value || '(not set)',
      sessions: parseInt(row.metricValues[0]?.value || 0),
      users: parseInt(row.metricValues[1]?.value || 0),
      newUsers: parseInt(row.metricValues[2]?.value || 0),
      conversions: parseFloat(row.metricValues[3]?.value || 0),
      revenue: parseFloat(row.metricValues[4]?.value || 0),
      transactions: parseInt(row.metricValues[5]?.value || 0),
    }));

    return {
      success: true,
      data: transformedData,
      pagination: {
        hasMore: result.rowCount > result.rows?.length,
        total: result.rowCount,
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
 * Transforms GA4 data to unified format
 * Note: GA4 doesn't have ad spend data, so we focus on conversions and revenue
 */
export function transformGA4ToUnified(data: GA4Data[], companyId: string): SyncedAdData[] {
  return data.map((item) => {
    const conversions = item.conversions || 0;
    const revenue = item.revenue || 0;
    const sessions = item.sessions || 0;

    // Create a campaign identifier from source/medium/campaign
    const campaignId = `${item.source}_${item.medium}_${item.campaign}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    const campaignName = item.campaign !== '(not set)'
      ? item.campaign
      : `${item.source} / ${item.medium}`;

    return {
      id: `ga4_${campaignId}_${item.date}`,
      companyId,
      platform: 'ga4',
      date: new Date(item.date),
      campaignId,
      campaignName,
      adSpend: 0, // GA4 doesn't track ad spend
      impressions: sessions, // Use sessions as proxy
      clicks: item.users, // Use users as proxy for clicks
      conversions,
      revenue,
      ctr: 0, // Not applicable for GA4
      cpc: 0, // Not tracked in GA4
      cpa: 0, // Can't calculate without spend
      roas: 0, // Can't calculate without spend
      rawData: item,
      syncedAt: new Date(),
    };
  });
}

/**
 * Gets available properties (not campaigns, as GA4 doesn't have campaigns in the same way)
 */
export async function getGA4Properties(
  credentials: GA4Credentials
): Promise<ApiResponse<{ id: string; name: string }[]>> {
  try {
    const accessToken = await getGA4AccessToken(credentials);
    if (!accessToken) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to obtain access token',
        },
      };
    }

    const response = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${credentials.propertyId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'GA4_API_ERROR',
          message: error.error?.message || 'Failed to fetch properties',
        },
      };
    }

    const property = await response.json();

    return {
      success: true,
      data: [
        {
          id: credentials.propertyId,
          name: property.displayName || 'GA4 Property',
        },
      ],
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
 * Validates GA4 credentials format
 */
export function validateGA4Credentials(credentials: Partial<GA4Credentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.propertyId) {
    errors.push('Property ID è richiesto');
  } else if (!/^\d+$/.test(credentials.propertyId)) {
    errors.push('Property ID deve contenere solo numeri');
  }

  if (!credentials.clientEmail) {
    errors.push('Client Email (Service Account) è richiesto');
  } else if (!credentials.clientEmail.includes('@')) {
    errors.push('Client Email non è valido');
  }

  if (!credentials.privateKey) {
    errors.push('Private Key è richiesto');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
