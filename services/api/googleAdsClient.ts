import { BaseApiClient } from './baseApiClient';
import { GoogleAdsMetrics, NormalizedAdData, ApiResponse } from '../../types/api.types';

export class GoogleAdsClient extends BaseApiClient {
  private apiVersion = 'v15';

  constructor(accessToken?: string) {
    const apiVersion = 'v15';
    super({
      baseUrl: `https://googleads.googleapis.com/${apiVersion}`,
      accessToken,
    });
  }

  /**
   * Fetch Google Ads campaign metrics using Google Ads Query Language (GAQL)
   * @param customerId - Google Ads Customer ID (without hyphens)
   * @param dateStart - Start date in YYYY-MM-DD format
   * @param dateEnd - End date in YYYY-MM-DD format
   */
  async getCampaignMetrics(
    customerId: string,
    dateStart: string,
    dateEnd: string
  ): Promise<ApiResponse<GoogleAdsMetrics[]>> {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        segments.date
      FROM campaign
      WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
        AND campaign.status = 'ENABLED'
      ORDER BY segments.date DESC
    `;

    return this.post<GoogleAdsMetrics[]>(
      `/customers/${customerId}/googleAds:searchStream`,
      { query }
    );
  }

  /**
   * Normalize Google Ads data to common format
   */
  normalizeData(googleData: GoogleAdsMetrics[]): NormalizedAdData[] {
    return googleData.map(campaign => {
      const spend = campaign.cost_micros / 1000000; // Convert micros to currency
      const conversionValue = campaign.conversion_value || 0;

      return {
        channel: 'google' as const,
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        date: new Date(campaign.date),
        spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions || 0,
        conversion_value: conversionValue,
        ctr: campaign.ctr,
        cpc: campaign.average_cpc / 1000000, // Convert micros to currency
        roas: spend > 0 ? conversionValue / spend : 0,
      };
    });
  }

  /**
   * Get account hierarchy
   */
  async getAccountHierarchy(customerId: string): Promise<ApiResponse<any>> {
    const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.currency_code,
        customer_client.time_zone
      FROM customer_client
      WHERE customer_client.manager = false
    `;

    return this.post(`/customers/${customerId}/googleAds:search`, { query });
  }
}
