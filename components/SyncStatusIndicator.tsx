import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import type { SyncStatus } from '../types/apiConnections.types';
import { getSyncStatuses } from '../services/syncScheduler';

interface SyncStatusIndicatorProps {
  companyId: string;
  className?: string;
}

export function SyncStatusIndicator({ companyId, className }: SyncStatusIndicatorProps) {
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadStatuses();
    // Refresh every 30 seconds
    const interval = setInterval(loadStatuses, 30000);
    return () => clearInterval(interval);
  }, [companyId]);

  const loadStatuses = async () => {
    const data = await getSyncStatuses(companyId);
    setStatuses(data);
  };

  const getOverallStatus = (): {
    status: 'syncing' | 'success' | 'error' | 'idle';
    message: string;
    color: string;
  } => {
    if (statuses.length === 0) {
      return {
        status: 'idle',
        message: 'Nessuna connessione configurata',
        color: 'gray',
      };
    }

    const isSyncing = statuses.some((s) => s.status === 'syncing');
    if (isSyncing) {
      return {
        status: 'syncing',
        message: 'Sincronizzazione in corso...',
        color: 'cyan',
      };
    }

    const hasError = statuses.some((s) => s.status === 'error');
    if (hasError) {
      return {
        status: 'error',
        message: 'Errore di sincronizzazione',
        color: 'red',
      };
    }

    const allSuccess = statuses.every((s) => s.status === 'success');
    if (allSuccess) {
      const mostRecent = statuses.reduce((latest, current) => {
        if (!latest.lastSync) return current;
        if (!current.lastSync) return latest;
        return current.lastSync > latest.lastSync ? current : latest;
      });

      const lastSyncTime = mostRecent.lastSync
        ? formatTimeDiff(mostRecent.lastSync)
        : 'mai';

      return {
        status: 'success',
        message: `Aggiornato ${lastSyncTime}`,
        color: 'green',
      };
    }

    return {
      status: 'idle',
      message: 'In attesa di sincronizzazione',
      color: 'gray',
    };
  };

  const formatTimeDiff = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h fa`;
    if (minutes > 0) return `${minutes}m fa`;
    return 'ora';
  };

  const getPlatformName = (platform: string): string => {
    const names: Record<string, string> = {
      meta_ads: 'Meta',
      google_ads: 'Google',
      tiktok_ads: 'TikTok',
      ga4: 'GA4',
    };
    return names[platform] || platform;
  };

  const overall = getOverallStatus();

  return (
    <div className={cn('relative', className)}>
      {/* Main Status Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          overall.color === 'cyan' && 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30',
          overall.color === 'green' && 'bg-green-600/20 text-green-400 border border-green-600/30',
          overall.color === 'red' && 'bg-red-600/20 text-red-400 border border-red-600/30',
          overall.color === 'gray' && 'bg-gray-700/50 text-gray-400 border border-gray-600',
          'hover:opacity-80'
        )}
      >
        {overall.status === 'syncing' && (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        )}
        {overall.status === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
        {overall.status === 'error' && <XCircle className="w-3.5 h-3.5" />}
        {overall.status === 'idle' && <Clock className="w-3.5 h-3.5" />}
        <span>{overall.message}</span>
      </button>

      {/* Expanded Details */}
      {isExpanded && statuses.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-gray-700">
            <h4 className="text-sm font-semibold text-gray-100">Stato Sincronizzazione</h4>
          </div>
          <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
            {statuses.map((status) => (
              <div
                key={status.platform}
                className="flex items-center justify-between p-2 bg-gray-700/50 rounded-md"
              >
                <div className="flex items-center gap-2">
                  {status.status === 'syncing' && (
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                  {status.status === 'success' && (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  )}
                  {status.status === 'error' && (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="text-sm text-gray-200">
                    {getPlatformName(status.platform)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {status.lastSync ? formatTimeDiff(status.lastSync) : 'mai'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click Outside to Close */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
