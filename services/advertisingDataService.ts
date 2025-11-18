import { MetaAdsClient } from './api/metaAdsClient';
import { GoogleAdsClient } from './api/googleAdsClient';
import { TikTokAdsClient } from './api/tiktokAdsClient';
import { NormalizedAdData, ChannelApiConfig, SyncStatus } from '../types/api.types';
import { spesaData } from '../lib/mockData';
import { CanaleEnum } from '../types';
import { format } from 'date-fns';

export class AdvertisingDataService {
  private metaClient: MetaAdsClient;
  private googleClient: GoogleAdsClient;
  private tiktokClient: TikTokAdsClient;
  private channelConfigs: Map<string, ChannelApiConfig>;
  private useRealApi: boolean;

  constructor() {
    this.metaClient = new MetaAdsClient();
    this.googleClient = new GoogleAdsClient();
    this.tiktokClient = new TikTokAdsClient();
    this.channelConfigs = new Map();

    // Check if we should use real API or mock data
    this.useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';
  }

  /**
   * Configure a channel's API credentials
   */
  configureChannel(config: ChannelApiConfig): void {
    this.channelConfigs.set(config.channel, config);

    // Set access tokens for the respective clients
    if (config.channel === 'meta' && config.credentials.accessToken) {
      this.metaClient.setAccessToken(config.credentials.accessToken);
    } else if (config.channel === 'google' && config.credentials.accessToken) {
      this.googleClient.setAccessToken(config.credentials.accessToken);
    } else if (config.channel === 'tiktok' && config.credentials.accessToken) {
      this.tiktokClient.setAccessToken(config.credentials.accessToken);
    }
  }

  /**
   * Fetch advertising data from all configured channels
   */
  async fetchAllChannelsData(
    dateStart: Date,
    dateEnd: Date
  ): Promise<NormalizedAdData[]> {
    if (!this.useRealApi) {
      // Return mock data
      return this.getMockData(dateStart, dateEnd);
    }

    const allData: NormalizedAdData[] = [];
    const dateStartStr = format(dateStart, 'yyyy-MM-dd');
    const dateEndStr = format(dateEnd, 'yyyy-MM-dd');

    // Fetch from all enabled channels in parallel
    const fetchPromises: Promise<void>[] = [];

    // Meta Ads
    const metaConfig = this.channelConfigs.get('meta');
    if (metaConfig?.enabled && metaConfig.credentials.accountId) {
      fetchPromises.push(
        this.metaClient
          .getInsights(metaConfig.credentials.accountId, dateStartStr, dateEndStr)
          .then(response => {
            if (response.success && response.data) {
              const normalized = this.metaClient.normalizeData(response.data);
              allData.push(...normalized);
            }
          })
          .catch(err => console.error('Meta Ads fetch error:', err))
      );
    }

    // Google Ads
    const googleConfig = this.channelConfigs.get('google');
    if (googleConfig?.enabled && googleConfig.credentials.accountId) {
      fetchPromises.push(
        this.googleClient
          .getCampaignMetrics(googleConfig.credentials.accountId, dateStartStr, dateEndStr)
          .then(response => {
            if (response.success && response.data) {
              const normalized = this.googleClient.normalizeData(response.data);
              allData.push(...normalized);
            }
          })
          .catch(err => console.error('Google Ads fetch error:', err))
      );
    }

    // TikTok Ads
    const tiktokConfig = this.channelConfigs.get('tiktok');
    if (tiktokConfig?.enabled && tiktokConfig.credentials.accountId) {
      fetchPromises.push(
        this.tiktokClient
          .getCampaignMetrics(tiktokConfig.credentials.accountId, dateStartStr, dateEndStr)
          .then(response => {
            if (response.success && response.data) {
              const normalized = this.tiktokClient.normalizeData(response.data);
              allData.push(...normalized);
            }
          })
          .catch(err => console.error('TikTok Ads fetch error:', err))
      );
    }

    await Promise.all(fetchPromises);

    return allData;
  }

  /**
   * Get mock data (current implementation)
   */
  private getMockData(dateStart: Date, dateEnd: Date): NormalizedAdData[] {
    return spesaData
      .filter(spesa => {
        const spesaDate = spesa.data_spesa;
        return spesaDate >= dateStart && spesaDate <= dateEnd;
      })
      .map(spesa => ({
        channel: this.mapCanaleToChannel(spesa.canale),
        campaign_id: `campaign_${spesa.id}`,
        campaign_name: `Campagna ${spesa.canale}`,
        date: spesa.data_spesa,
        spend: spesa.importo,
        impressions: Math.floor(spesa.importo * 100), // Mock impressions
        clicks: Math.floor(spesa.importo * 2), // Mock clicks
        conversions: 0,
        conversion_value: 0,
        ctr: 2.0,
        cpc: spesa.importo / Math.max(1, Math.floor(spesa.importo * 2)),
        roas: 0,
        store_id: spesa.negozio_id,
      }));
  }

  /**
   * Map CanaleEnum to channel type
   */
  private mapCanaleToChannel(
    canale: CanaleEnum
  ): 'meta' | 'google' | 'tiktok' | 'linkedin' | 'other' {
    switch (canale) {
      case CanaleEnum.MetaAds:
        return 'meta';
      case CanaleEnum.GoogleAds:
        return 'google';
      case CanaleEnum.TikTokAds:
        return 'tiktok';
      case CanaleEnum.LinkedInAds:
        return 'linkedin';
      default:
        return 'other';
    }
  }

  /**
   * Get sync status for all channels
   */
  getSyncStatus(): SyncStatus[] {
    const statuses: SyncStatus[] = [];

    this.channelConfigs.forEach((config, channel) => {
      statuses.push({
        channel,
        lastSync: config.lastSync || null,
        nextSync: config.lastSync && config.syncInterval
          ? new Date(config.lastSync.getTime() + config.syncInterval * 60000)
          : null,
        status: 'idle',
      });
    });

    return statuses;
  }

  /**
   * Test connection to a specific channel
   */
  async testConnection(channel: 'meta' | 'google' | 'tiktok'): Promise<boolean> {
    try {
      const config = this.channelConfigs.get(channel);
      if (!config?.enabled || !config.credentials.accountId) {
        return false;
      }

      let response;
      switch (channel) {
        case 'meta':
          response = await this.metaClient.getCampaigns(config.credentials.accountId);
          break;
        case 'google':
          response = await this.googleClient.getAccountHierarchy(config.credentials.accountId);
          break;
        case 'tiktok':
          response = await this.tiktokClient.getAdvertiserInfo(config.credentials.accountId);
          break;
      }

      return response?.success || false;
    } catch (error) {
      console.error(`Connection test failed for ${channel}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const advertisingDataService = new AdvertisingDataService();
