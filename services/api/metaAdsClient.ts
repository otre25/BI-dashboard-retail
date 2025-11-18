import { BaseApiClient } from './baseApiClient';
import { MetaAdsMetrics, NormalizedAdData, ApiResponse } from '../../types/api.types';

export class MetaAdsClient extends BaseApiClient {
  private apiVersion = 'v18.0';

  constructor(accessToken?: string) {
    const apiVersion = 'v18.0';
    super({
      baseUrl: `https://graph.facebook.com/${apiVersion}`,
      accessToken,
    });
  }

  /**
   * Fetch ad account insights
   * @param accountId - Meta Ad Account ID (e.g., "act_123456789")
   * @param dateStart - Start date in YYYY-MM-DD format
   * @param dateEnd - End date in YYYY-MM-DD format
   */
  async getInsights(
    accountId: string,
    dateStart: string,
    dateEnd: string
  ): Promise<ApiResponse<MetaAdsMetrics[]>> {
    const fields = [
      'campaign_id',
      'campaign_name',
      'spend',
      'impressions',
      'clicks',
      'reach',
      'ctr',
      'cpc',
      'cpm',
      'conversions',
      'action_values', // for conversion_value
    ].join(',');

    const params = {
      fields,
      time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
      level: 'campaign',
      limit: 1000,
    };

    return this.get<MetaAdsMetrics[]>(`/${accountId}/insights`, params);
  }

  /**
   * Normalize Meta Ads data to common format
   */
  normalizeData(metaData: MetaAdsMetrics[]): NormalizedAdData[] {
    return metaData.map(campaign => ({
      channel: 'meta' as const,
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      date: new Date(campaign.date_start),
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
   * Get campaigns list
   */
  async getCampaigns(accountId: string): Promise<ApiResponse<any[]>> {
    const params = {
      fields: 'id,name,status,objective',
      limit: 100,
    };

    return this.get(`/${accountId}/campaigns`, params);
  }
}
