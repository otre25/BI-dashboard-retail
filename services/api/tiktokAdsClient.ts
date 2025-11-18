import { BaseApiClient } from './baseApiClient';
import { TikTokAdsMetrics, NormalizedAdData, ApiResponse } from '../../types/api.types';

export class TikTokAdsClient extends BaseApiClient {
  constructor(accessToken?: string) {
    super({
      baseUrl: 'https://business-api.tiktok.com/open_api/v1.3',
      accessToken,
    });
  }

  /**
   * Fetch TikTok Ads campaign metrics
   * @param advertiserId - TikTok Advertiser ID
   * @param dateStart - Start date in YYYY-MM-DD format
   * @param dateEnd - End date in YYYY-MM-DD format
   */
  async getCampaignMetrics(
    advertiserId: string,
    dateStart: string,
    dateEnd: string
  ): Promise<ApiResponse<TikTokAdsMetrics[]>> {
    const params = {
      advertiser_id: advertiserId,
      start_date: dateStart,
      end_date: dateEnd,
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: JSON.stringify(['campaign_id', 'stat_time_day']),
      metrics: JSON.stringify([
        'spend',
        'impressions',
        'clicks',
        'ctr',
        'cpc',
        'conversion',
        'cost_per_conversion',
        'total_purchase_value',
      ]),
      page: 1,
      page_size: 1000,
    };

    return this.get<TikTokAdsMetrics[]>('/reports/integrated/get', params);
  }

  /**
   * Normalize TikTok Ads data to common format
   */
  normalizeData(tiktokData: TikTokAdsMetrics[]): NormalizedAdData[] {
    return tiktokData.map(campaign => ({
      channel: 'tiktok' as const,
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      date: new Date(campaign.stat_time_day),
      spend: campaign.spend,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions || 0,
      conversion_value: campaign.conversion_value || 0,
      ctr: campaign.ctr,
      cpc: campaign.cpc,
      roas: campaign.spend > 0 ? (campaign.conversion_value || 0) / campaign.spend : 0,
    }));
  }

  /**
   * Get advertiser info
   */
  async getAdvertiserInfo(advertiserId: string): Promise<ApiResponse<any>> {
    const params = {
      advertiser_ids: JSON.stringify([advertiserId]),
      fields: JSON.stringify(['name', 'currency', 'timezone']),
    };

    return this.get('/advertiser/info', params);
  }

  /**
   * Get campaigns list
   */
  async getCampaigns(advertiserId: string): Promise<ApiResponse<any[]>> {
    const params = {
      advertiser_id: advertiserId,
      filtering: JSON.stringify({
        campaign_status: ['CAMPAIGN_STATUS_ENABLE'],
      }),
      page: 1,
      page_size: 100,
    };

    return this.get('/campaign/get', params);
  }
}
