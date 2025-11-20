// Sync scheduler service for automatic data synchronization

import type {
  PlatformType,
  ApiCredentials,
  SyncStatus,
  SyncLog,
  SyncedAdData,
} from '../types/apiConnections.types';
import { supabase } from '../lib/supabase';
import {
  fetchMetaAdsData,
  transformMetaAdsToUnified,
} from './apiConnectors/metaAdsConnector';
import {
  fetchGoogleAdsData,
  transformGoogleAdsToUnified,
} from './apiConnectors/googleAdsConnector';
import {
  fetchTikTokAdsData,
  transformTikTokAdsToUnified,
} from './apiConnectors/tiktokAdsConnector';
import { fetchGA4Data, transformGA4ToUnified } from './apiConnectors/ga4Connector';

// Store active sync intervals
const activeSyncIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Starts automatic sync for a platform
 */
export function startAutoSync(
  credentials: ApiCredentials,
  companyId: string
): { success: boolean; error?: string } {
  try {
    const key = `${companyId}_${credentials.platform}`;

    // Stop existing sync if any
    stopAutoSync(companyId, credentials.platform);

    // Run initial sync immediately
    syncPlatformData(credentials, companyId);

    // Schedule recurring syncs
    const intervalMs = credentials.syncInterval * 60 * 1000; // Convert minutes to ms
    const interval = setInterval(() => {
      syncPlatformData(credentials, companyId);
    }, intervalMs);

    activeSyncIntervals.set(key, interval);

    console.log(
      `[Sync] Started auto-sync for ${credentials.platform} every ${credentials.syncInterval} minutes`
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stops automatic sync for a platform
 */
export function stopAutoSync(companyId: string, platform: PlatformType): void {
  const key = `${companyId}_${platform}`;
  const interval = activeSyncIntervals.get(key);

  if (interval) {
    clearInterval(interval);
    activeSyncIntervals.delete(key);
    console.log(`[Sync] Stopped auto-sync for ${platform}`);
  }
}

/**
 * Stops all active syncs
 */
export function stopAllSyncs(): void {
  activeSyncIntervals.forEach((interval, key) => {
    clearInterval(interval);
    console.log(`[Sync] Stopped ${key}`);
  });
  activeSyncIntervals.clear();
}

/**
 * Syncs data for a specific platform
 */
export async function syncPlatformData(
  credentials: ApiCredentials,
  companyId: string
): Promise<{ success: boolean; recordsSynced: number; error?: string }> {
  const logId = `${Date.now()}_${credentials.platform}`;

  try {
    console.log(`[Sync] Starting sync for ${credentials.platform}...`);

    // Update sync status to 'syncing'
    await updateSyncStatus(companyId, credentials.platform, {
      status: 'syncing',
      progress: 0,
    });

    // Create sync log
    const syncLog: Partial<SyncLog> = {
      platform: credentials.platform,
      companyId,
      status: 'started',
      startTime: new Date(),
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
    };

    // Determine date range (last 30 days)
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    // Fetch data from platform
    let syncedData: SyncedAdData[] = [];

    switch (credentials.platform) {
      case 'meta_ads':
        const metaResult = await fetchMetaAdsData(credentials.credentials as any, dateFrom, dateTo);
        if (metaResult.success && metaResult.data) {
          syncedData = transformMetaAdsToUnified(metaResult.data, companyId);
        } else {
          throw new Error(metaResult.error?.message || 'Meta Ads sync failed');
        }
        break;

      case 'google_ads':
        const googleResult = await fetchGoogleAdsData(
          credentials.credentials as any,
          dateFrom,
          dateTo
        );
        if (googleResult.success && googleResult.data) {
          syncedData = transformGoogleAdsToUnified(googleResult.data, companyId);
        } else {
          throw new Error(googleResult.error?.message || 'Google Ads sync failed');
        }
        break;

      case 'tiktok_ads':
        const tiktokResult = await fetchTikTokAdsData(
          credentials.credentials as any,
          dateFrom,
          dateTo
        );
        if (tiktokResult.success && tiktokResult.data) {
          syncedData = transformTikTokAdsToUnified(tiktokResult.data, companyId);
        } else {
          throw new Error(tiktokResult.error?.message || 'TikTok Ads sync failed');
        }
        break;

      case 'ga4':
        const ga4Result = await fetchGA4Data(credentials.credentials as any, dateFrom, dateTo);
        if (ga4Result.success && ga4Result.data) {
          syncedData = transformGA4ToUnified(ga4Result.data, companyId);
        } else {
          throw new Error(ga4Result.error?.message || 'GA4 sync failed');
        }
        break;

      default:
        throw new Error(`Unsupported platform: ${credentials.platform}`);
    }

    // Store synced data in Supabase
    if (syncedData.length > 0) {
      const { error: insertError } = await supabase
        .from('synced_ad_data')
        .upsert(syncedData, {
          onConflict: 'id',
        });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
    }

    // Update sync status to 'success'
    await updateSyncStatus(companyId, credentials.platform, {
      status: 'success',
      lastSync: new Date(),
      nextSync: new Date(Date.now() + credentials.syncInterval * 60 * 1000),
      recordsSynced: syncedData.length,
      progress: 100,
    });

    // Complete sync log
    syncLog.status = 'completed';
    syncLog.endTime = new Date();
    syncLog.recordsProcessed = syncedData.length;
    syncLog.recordsSuccess = syncedData.length;
    await saveSyncLog(syncLog as SyncLog);

    console.log(`[Sync] ✓ Synced ${syncedData.length} records from ${credentials.platform}`);

    return {
      success: true,
      recordsSynced: syncedData.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[Sync] ✗ Error syncing ${credentials.platform}:`, errorMessage);

    // Update sync status to 'error'
    await updateSyncStatus(companyId, credentials.platform, {
      status: 'error',
      error: errorMessage,
    });

    // Save error log
    await saveSyncLog({
      id: logId,
      platform: credentials.platform,
      companyId,
      status: 'failed',
      startTime: new Date(),
      endTime: new Date(),
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      error: errorMessage,
    });

    return {
      success: false,
      recordsSynced: 0,
      error: errorMessage,
    };
  }
}

/**
 * Updates sync status in database
 */
async function updateSyncStatus(
  companyId: string,
  platform: PlatformType,
  updates: Partial<SyncStatus>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('sync_status')
      .upsert(
        {
          company_id: companyId,
          platform,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'company_id,platform',
        }
      );

    if (error) {
      console.error('Error updating sync status:', error);
    }
  } catch (error) {
    console.error('Error in updateSyncStatus:', error);
  }
}

/**
 * Saves sync log to database
 */
async function saveSyncLog(log: SyncLog): Promise<void> {
  try {
    const { error } = await supabase.from('sync_logs').insert({
      id: log.id,
      platform: log.platform,
      company_id: log.companyId,
      status: log.status,
      start_time: log.startTime.toISOString(),
      end_time: log.endTime?.toISOString(),
      records_processed: log.recordsProcessed,
      records_success: log.recordsSuccess,
      records_failed: log.recordsFailed,
      error: log.error,
      details: log.details,
    });

    if (error) {
      console.error('Error saving sync log:', error);
    }
  } catch (error) {
    console.error('Error in saveSyncLog:', error);
  }
}

/**
 * Gets sync status for all platforms
 */
export async function getSyncStatuses(companyId: string): Promise<SyncStatus[]> {
  try {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching sync statuses:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      platform: item.platform,
      companyId: item.company_id,
      status: item.status,
      lastSync: item.last_sync ? new Date(item.last_sync) : null,
      nextSync: item.next_sync ? new Date(item.next_sync) : null,
      syncInterval: item.sync_interval,
      recordsSynced: item.records_synced || 0,
      error: item.error,
      progress: item.progress,
    }));
  } catch (error) {
    console.error('Error in getSyncStatuses:', error);
    return [];
  }
}

/**
 * Gets recent sync logs
 */
export async function getSyncLogs(
  companyId: string,
  platform?: PlatformType,
  limit: number = 50
): Promise<SyncLog[]> {
  try {
    let query = supabase
      .from('sync_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sync logs:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      platform: item.platform,
      companyId: item.company_id,
      status: item.status,
      startTime: new Date(item.start_time),
      endTime: item.end_time ? new Date(item.end_time) : undefined,
      recordsProcessed: item.records_processed,
      recordsSuccess: item.records_success,
      recordsFailed: item.records_failed,
      error: item.error,
      details: item.details,
    }));
  } catch (error) {
    console.error('Error in getSyncLogs:', error);
    return [];
  }
}

/**
 * Manually triggers sync for a platform
 */
export async function triggerManualSync(
  companyId: string,
  platform: PlatformType
): Promise<{ success: boolean; recordsSynced?: number; error?: string }> {
  try {
    // Fetch credentials from database
    const { data: credentialsData, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (credError || !credentialsData) {
      return {
        success: false,
        error: 'Credenziali non trovate o non attive',
      };
    }

    const credentials: ApiCredentials = {
      id: credentialsData.id,
      platform: credentialsData.platform,
      companyId: credentialsData.company_id,
      credentials: credentialsData.credentials,
      isActive: credentialsData.is_active,
      lastSync: credentialsData.last_sync ? new Date(credentialsData.last_sync) : null,
      nextSync: credentialsData.next_sync ? new Date(credentialsData.next_sync) : null,
      syncInterval: credentialsData.sync_interval || 30,
      createdAt: new Date(credentialsData.created_at),
      updatedAt: new Date(credentialsData.updated_at),
    };

    return await syncPlatformData(credentials, companyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
