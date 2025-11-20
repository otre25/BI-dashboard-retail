import React, { useState, useEffect } from 'react';
import {
  Link2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PlatformType, ApiCredentials, SyncStatus } from '../../types/apiConnections.types';
import { getSyncStatuses, triggerManualSync, startAutoSync } from '../../services/syncScheduler';

interface ApiConnectionsPanelProps {
  companyId: string;
}

const PLATFORMS: { type: PlatformType; name: string; color: string }[] = [
  { type: 'meta_ads', name: 'Meta Ads (Facebook/Instagram)', color: 'blue' },
  { type: 'google_ads', name: 'Google Ads', color: 'red' },
  { type: 'tiktok_ads', name: 'TikTok Ads', color: 'pink' },
  { type: 'ga4', name: 'Google Analytics 4', color: 'orange' },
];

export function ApiConnectionsPanel({ companyId }: ApiConnectionsPanelProps) {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSyncStatuses();
    // Refresh statuses every 30 seconds
    const interval = setInterval(loadSyncStatuses, 30000);
    return () => clearInterval(interval);
  }, [companyId]);

  const loadSyncStatuses = async () => {
    const statuses = await getSyncStatuses(companyId);
    setSyncStatuses(statuses);
  };

  const handleManualSync = async (platform: PlatformType) => {
    setIsLoading(true);
    try {
      const result = await triggerManualSync(companyId, platform);
      if (result.success) {
        alert(`Sincronizzazione completata! ${result.recordsSynced} record importati.`);
        await loadSyncStatuses();
      } else {
        alert(`Errore: ${result.error}`);
      }
    } catch (error) {
      alert('Errore durante la sincronizzazione');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformStatus = (platform: PlatformType): SyncStatus | undefined => {
    return syncStatuses.find((s) => s.platform === platform);
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Mai sincronizzato';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} giorni fa`;
    if (hours > 0) return `${hours} ore fa`;
    if (minutes > 0) return `${minutes} minuti fa`;
    return 'Pochi secondi fa';
  };

  const renderPlatformCard = (platform: { type: PlatformType; name: string; color: string }) => {
    const status = getPlatformStatus(platform.type);
    const isConnected = status && status.lastSync;

    return (
      <div
        key={platform.type}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
      >
        {/* Platform Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{platform.name}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {isConnected ? 'Connesso e sincronizzato' : 'Non configurato'}
            </p>
          </div>
          <div
            className={cn(
              'p-2 rounded-lg',
              isConnected ? 'bg-green-500/20' : 'bg-gray-700'
            )}
          >
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>

        {/* Status Info */}
        {status && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Ultima sincronizzazione:</span>
              <span className="text-gray-200">{formatLastSync(status.lastSync)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Record sincronizzati:</span>
              <span className="text-gray-200">{status.recordsSynced || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Intervallo sync:</span>
              <span className="text-gray-200">{status.syncInterval} minuti</span>
            </div>
            {status.status === 'syncing' && (
              <div className="flex items-center gap-2 text-sm text-cyan-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sincronizzazione in corso... {status.progress}%</span>
              </div>
            )}
            {status.error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded p-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{status.error}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <button
                onClick={() => handleManualSync(platform.type)}
                disabled={isLoading || status?.status === 'syncing'}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  'bg-cyan-600 text-white hover:bg-cyan-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <RefreshCw
                  className={cn(
                    'w-4 h-4',
                    status?.status === 'syncing' && 'animate-spin'
                  )}
                />
                Sincronizza Ora
              </button>
              <button
                onClick={() => setSelectedPlatform(platform.type)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Modifica
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectedPlatform(platform.type)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Configura Connessione
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Connessioni API</h2>
          <p className="text-gray-400 mt-1">
            Collega i tuoi canali pubblicitari per sincronizzazione automatica dei dati
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-1">
              Sincronizzazione Automatica
            </h3>
            <p className="text-xs text-gray-400">
              I dati vengono sincronizzati automaticamente ogni 30 minuti (configurabile). Puoi anche
              avviare una sincronizzazione manuale in qualsiasi momento.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PLATFORMS.map((platform) => renderPlatformCard(platform))}
      </div>

      {/* Help Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Come Ottenere le API Key?
        </h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div>
            <strong className="text-gray-300">Meta Ads:</strong> Crea un'app su{' '}
            <a
              href="https://developers.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
            >
              developers.facebook.com
            </a>
          </div>
          <div>
            <strong className="text-gray-300">Google Ads:</strong> Richiedi l'accesso API e il
            Developer Token da{' '}
            <a
              href="https://developers.google.com/google-ads/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Google Ads API
            </a>
          </div>
          <div>
            <strong className="text-gray-300">TikTok Ads:</strong> Crea un'app in TikTok For
            Business e ottieni le credenziali
          </div>
          <div>
            <strong className="text-gray-300">GA4:</strong> Crea un Service Account in Google
            Cloud Console con accesso a Google Analytics
          </div>
        </div>
      </div>

      {/* Credentials Modal would go here */}
      {selectedPlatform && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              Configura {PLATFORMS.find((p) => p.type === selectedPlatform)?.name}
            </h3>
            <p className="text-gray-400 mb-6">
              Inserisci le credenziali API per abilitare la sincronizzazione automatica dei dati.
            </p>
            {/* Form fields would go here based on platform type */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlatform(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Annulla
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">
                Salva e Testa Connessione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
