// TikTok Ads API Connector

import type {
  TikTokAdsCredentials,
  TikTokAdsData,
  SyncedAdData,
  ApiResponse,
  ConnectionTestResult,
} from '../../types/apiConnections.types';

const TIKTOK_ADS_BASE_URL = 'https://business-api.tiktok.com/open_api/v1.3';

/**
 * Tests TikTok Ads connection
 */
export async function testTikTokAdsConnection(
  credentials: TikTokAdsCredentials
): Promise<ConnectionTestResult> {
  try {
    const response = await fetch(`${TIKTOK_ADS_BASE_URL}/advertiser/info/`, {
      method: 'GET',
      headers: {
        'Access-Token': credentials.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        platform: 'tiktok_ads',
        success: false,
        message: 'Connessione fallita',
        error: error.message || 'Unknown error',
      };
    }

    const data = await response.json();

    if (data.code !== 0) {
      return {
        platform: 'tiktok_ads',
        success: false,
        message: 'Connessione fallita',
        error: data.message || 'API error',
      };
    }

    const advertiser = data.data?.list?.[0];

    return {
      platform: 'tiktok_ads',
      success: true,
      message: 'Connessione riuscita',
      accountInfo: {
        name: advertiser?.name || 'TikTok Ads Account',
        id: credentials.advertiserId,
        currency: advertiser?.currency || 'USD',
      },
    };
  } catch (error) {
    return {
      platform: 'tiktok_ads',
      success: false,
      message: 'Errore di connessione',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches TikTok Ads data for a date range
 */
export async function fetchTikTokAdsData(
  credentials: TikTokAdsCredentials,
  dateFrom: Date,
  dateTo: Date
): Promise<ApiResponse<TikTokAdsData[]>> {
  try {
    const startDate = dateFrom.toISOString().split('T')[0];
    const endDate = dateTo.toISOString().split('T')[0];

    // TikTok uses POST for reporting
    const requestBody = {
      advertiser_id: credentials.advertiserId,
      service_type: 'AUCTION',
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: ['campaign_id', 'stat_time_day'],
      metrics: [
        'spend',
        'impressions',
        'clicks',
        'conversions',
        'cost_per_conversion',
        'conversion_rate',
        'complete_payment', // TikTok's conversion value
      ],
      start_date: startDate,
      end_date: endDate,
      page: 1,
      page_size: 1000,
    };

    const response = await fetch(`${TIKTOK_ADS_BASE_URL}/reports/integrated/get/`, {
      method: 'POST',
      headers: {
        'Access-Token': credentials.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'TIKTOK_ADS_API_ERROR',
          message: error.message || 'Failed to fetch data',
          details: error,
        },
      };
    }

    const result = await response.json();

    if (result.code !== 0) {
      return {
        success: false,
        error: {
          code: 'TIKTOK_ADS_API_ERROR',
          message: result.message || 'API returned error',
          details: result,
        },
      };
    }

    // Get campaign details for names
    const campaigns = await getTikTokCampaignDetails(
      credentials,
      result.data?.list?.map((item: any) => item.dimensions?.campaign_id) || []
    );

    // Transform TikTok data
    const transformedData: TikTokAdsData[] = (result.data?.list || []).map((item: any) => {
      const campaignId = item.dimensions?.campaign_id || '';
      const campaign = campaigns.get(campaignId);

      return {
        date: item.dimensions?.stat_time_day || '',
        campaign_id: campaignId,
        campaign_name: campaign?.name || `Campaign ${campaignId}`,
        adgroup_id: item.dimensions?.adgroup_id || '',
        adgroup_name: item.dimensions?.adgroup_name || '',
        spend: parseFloat(item.metrics?.spend || 0),
        impressions: parseInt(item.metrics?.impressions || 0),
        clicks: parseInt(item.metrics?.clicks || 0),
        conversions: parseFloat(item.metrics?.conversions || 0),
        conversion_value: parseFloat(item.metrics?.complete_payment || 0),
      };
    });

    return {
      success: true,
      data: transformedData,
      pagination: {
        hasMore: result.data?.page_info?.total_page > result.data?.page_info?.page,
        total: result.data?.page_info?.total_number,
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
 * Gets campaign details by IDs
 */
async function getTikTokCampaignDetails(
  credentials: TikTokAdsCredentials,
  campaignIds: string[]
): Promise<Map<string, { name: string; status: string }>> {
  const campaignMap = new Map();

  if (campaignIds.length === 0) return campaignMap;

  try {
    const params = new URLSearchParams({
      advertiser_id: credentials.advertiserId,
      filtering: JSON.stringify({
        campaign_ids: [...new Set(campaignIds)], // Remove duplicates
      }),
    });

    const response = await fetch(`${TIKTOK_ADS_BASE_URL}/campaign/get/?${params}`, {
      method: 'GET',
      headers: {
        'Access-Token': credentials.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 0 && result.data?.list) {
        result.data.list.forEach((campaign: any) => {
          campaignMap.set(campaign.campaign_id, {
            name: campaign.campaign_name,
            status: campaign.operation_status,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching TikTok campaign details:', error);
  }

  return campaignMap;
}

/**
 * Transforms TikTok Ads data to unified format
 */
export function transformTikTokAdsToUnified(
  data: TikTokAdsData[],
  companyId: string
): SyncedAdData[] {
  return data.map((item) => {
    const clicks = item.clicks || 0;
    const impressions = item.impressions || 0;
    const spend = item.spend || 0;
    const conversions = item.conversions || 0;
    const revenue = item.conversion_value || 0;

    return {
      id: `tiktok_${item.campaign_id}_${item.date}`,
      companyId,
      platform: 'tiktok_ads',
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
export async function getTikTokAdsCampaigns(
  credentials: TikTokAdsCredentials
): Promise<ApiResponse<{ id: string; name: string; status: string }[]>> {
  try {
    const params = new URLSearchParams({
      advertiser_id: credentials.advertiserId,
    });

    const response = await fetch(`${TIKTOK_ADS_BASE_URL}/campaign/get/?${params}`, {
      method: 'GET',
      headers: {
        'Access-Token': credentials.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: 'TIKTOK_ADS_API_ERROR',
          message: error.message || 'Failed to fetch campaigns',
        },
      };
    }

    const result = await response.json();

    if (result.code !== 0) {
      return {
        success: false,
        error: {
          code: 'TIKTOK_ADS_API_ERROR',
          message: result.message || 'API error',
        },
      };
    }

    const campaigns = (result.data?.list || []).map((item: any) => ({
      id: item.campaign_id,
      name: item.campaign_name,
      status: item.operation_status,
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
 * Validates TikTok Ads credentials format
 */
export function validateTikTokAdsCredentials(credentials: Partial<TikTokAdsCredentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.accessToken) {
    errors.push('Access Token è richiesto');
  }

  if (!credentials.advertiserId) {
    errors.push('Advertiser ID è richiesto');
  } else if (!/^\d+$/.test(credentials.advertiserId)) {
    errors.push('Advertiser ID deve contenere solo numeri');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
