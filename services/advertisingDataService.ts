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
        return spesa.data >= dateStart && spesa.data <= dateEnd;
      })
      .map(spesa => ({
        channel: this.mapCanaleToChannel(spesa.canale),
        campaign_id: `campaign_${spesa.id}`,
        campaign_name: `Campagna ${spesa.canale}`,
        date: spesa.data,
        spend: spesa.spesa,
        impressions: spesa.impression,
        clicks: spesa.click,
        conversions: 0,
        conversion_value: 0,
        ctr: spesa.impression > 0 ? (spesa.click / spesa.impression) * 100 : 0,
        cpc: spesa.spesa / Math.max(1, spesa.click),
        roas: 0,
      }));
  }

  /**
   * Map CanaleEnum to channel type
   */
  private mapCanaleToChannel(
    canale: CanaleEnum
  ): 'meta' | 'google' | 'tiktok' | 'linkedin' | 'other' {
    switch (canale) {
      case CanaleEnum.Meta:
        return 'meta';
      case CanaleEnum.Google:
        return 'google';
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
  async testConnection(channel: 'meta' | 'google' | 'tiktok' | 'linkedin'): Promise<boolean> {
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
        default:
          return false; // nessun connettore per questo canale
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
