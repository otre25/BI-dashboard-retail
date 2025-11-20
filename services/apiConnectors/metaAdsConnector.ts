// Meta Ads (Facebook/Instagram) API Connector

import type {
  MetaAdsCredentials,
  MetaAdsData,
  SyncedAdData,
  ApiResponse,
  ConnectionTestResult,
} from '../../types/apiConnections.types';

const META_ADS_API_VERSION = 'v19.0';
const META_ADS_BASE_URL = `https://graph.facebook.com/${META_ADS_API_VERSION}`;

/**
 * Tests Meta Ads connection
 */
export async function testMetaAdsConnection(
  credentials: MetaAdsCredentials
): Promise<ConnectionTestResult> {
  try {
    const response = await fetch(
      `${META_ADS_BASE_URL}/act_${credentials.adAccountId}?fields=name,account_id,currency&access_token=${credentials.accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        platform: 'meta_ads',
        success: false,
        message: 'Connessione fallita',
        error: error.error?.message || 'Unknown error',
      };
    }

    const data = await response.json();

    return {
      platform: 'meta_ads',
      success: true,
      message: 'Connessione riuscita',
      accountInfo: {
        name: data.name,
        id: data.account_id,
        currency: data.currency,
      },
    };
  } catch (error) {
    return {
      platform: 'meta_ads',
      success: false,
      message: 'Errore di connessione',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches Meta Ads data for a date range
 */
export async function fetchMetaAdsData(
  credentials: MetaAdsCredentials,
  dateFrom: Date,
  dateTo: Date
): Promise<ApiResponse<MetaAdsData[]>> {
  try {
    const fields = [
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'spend',
      'impressions',
      'clicks',
      'actions', // Contains conversions
      'action_values', // Contains revenue
    ].join(',');

    const params = new URLSearchParams({
      access_token: credentials.accessToken,
      fields: fields,
      time_range: JSON.stringify({
        since: dateFrom.toISOString().split('T')[0],
        until: dateTo.toISOString().split('T')[0],
      }),
      level: 'campaign',
      time_increment: 1, // Daily breakdown
      limit: '500',
    });

    const url = `${META_ADS_BASE_URL}/act_${credentials.adAccountId}/insights?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'META_ADS_API_ERROR',
          message: error.error?.message || 'Failed to fetch data',
          details: error,
        },
      };
    }

    const result = await response.json();

    // Transform Meta Ads data to our format
    const transformedData: MetaAdsData[] = result.data.map((item: any) => {
      // Extract conversions from actions array
      const conversions =
        item.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0;

      // Extract revenue from action_values array
      const revenue =
        item.action_values?.find((a: any) => a.action_type === 'purchase')?.value || 0;

      return {
        date: item.date_start,
        campaign_id: item.campaign_id,
        campaign_name: item.campaign_name,
        ad_set_id: item.adset_id,
        ad_set_name: item.adset_name,
        spend: parseFloat(item.spend || 0),
        impressions: parseInt(item.impressions || 0),
        clicks: parseInt(item.clicks || 0),
        conversions: parseFloat(conversions),
        revenue: parseFloat(revenue),
      };
    });

    return {
      success: true,
      data: transformedData,
      pagination: {
        hasMore: !!result.paging?.next,
        nextCursor: result.paging?.cursors?.after,
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
 * Transforms Meta Ads data to unified format
 */
export function transformMetaAdsToUnified(
  data: MetaAdsData[],
  companyId: string
): SyncedAdData[] {
  return data.map((item) => {
    const clicks = item.clicks || 0;
    const impressions = item.impressions || 0;
    const spend = item.spend || 0;
    const conversions = item.conversions || 0;
    const revenue = item.revenue || 0;

    return {
      id: `meta_${item.campaign_id}_${item.date}`,
      companyId,
      platform: 'meta_ads',
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
export async function getMetaAdsCampaigns(
  credentials: MetaAdsCredentials
): Promise<ApiResponse<{ id: string; name: string; status: string }[]>> {
  try {
    const params = new URLSearchParams({
      access_token: credentials.accessToken,
      fields: 'id,name,status',
      limit: '100',
    });

    const url = `${META_ADS_BASE_URL}/act_${credentials.adAccountId}/campaigns?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'META_ADS_API_ERROR',
          message: error.error?.message || 'Failed to fetch campaigns',
        },
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result.data,
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
 * Validates Meta Ads credentials format
 */
export function validateMetaAdsCredentials(credentials: Partial<MetaAdsCredentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.accessToken) {
    errors.push('Access Token è richiesto');
  } else if (credentials.accessToken.length < 50) {
    errors.push('Access Token non sembra valido');
  }

  if (!credentials.adAccountId) {
    errors.push('Ad Account ID è richiesto');
  } else if (!/^\d+$/.test(credentials.adAccountId)) {
    errors.push('Ad Account ID deve contenere solo numeri');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
