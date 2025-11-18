import React, { useState } from 'react';
import { FileDown, Bell, RefreshCw, Sun, Moon, Clock, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ExportModal } from './ExportModal';
import { ShareModal } from './ShareModal';

interface QuickActionsProps {
  onToggleTheme: () => void;
  isDarkTheme: boolean;
  lastUpdate: Date;
  shareUrl: string;
}

export function QuickActions({ onToggleTheme, isDarkTheme, lastUpdate, shareUrl }: QuickActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
      {/* Left side - Quick actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExportModalOpen(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200',
            'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30',
            'hover:bg-cyan-600/30 hover:border-cyan-500',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500',
            'min-h-[36px]'
          )}
        >
          <FileDown className="w-4 h-4" />
          <span>Esporta Report</span>
        </button>

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200',
            'bg-gray-700/50 text-gray-300 border border-gray-600',
            'hover:bg-gray-600/50 hover:text-white',
            'focus:outline-none focus:ring-2 focus:ring-gray-500',
            'min-h-[36px]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          <span>{isRefreshing ? 'Aggiornamento...' : 'Aggiorna Dati'}</span>
        </button>

        <button
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200',
            'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
            'hover:bg-yellow-600/30 hover:border-yellow-500',
            'focus:outline-none focus:ring-2 focus:ring-yellow-500',
            'min-h-[36px]'
          )}
        >
          <Bell className="w-4 h-4" />
          <span>Imposta Alert</span>
        </button>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200',
            'bg-purple-600/20 text-purple-400 border border-purple-600/30',
            'hover:bg-purple-600/30 hover:border-purple-500',
            'focus:outline-none focus:ring-2 focus:ring-purple-500',
            'min-h-[36px]'
          )}
        >
          <Share2 className="w-4 h-4" />
          <span>Condividi</span>
        </button>
      </div>

      {/* Right side - Theme toggle and timestamp */}
      <div className="flex items-center gap-4">
        {/* Last update timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Ultimo aggiornamento: {formatTime(lastUpdate)}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={cn(
            'flex items-center gap-2 p-2 rounded-md transition-all duration-200',
            'bg-gray-700/50 border border-gray-600',
            'hover:bg-gray-600/50',
            'focus:outline-none focus:ring-2 focus:ring-gray-500'
          )}
          aria-label={isDarkTheme ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
        >
          {isDarkTheme ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400" />
          )}
        </button>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareUrl}
      />
    </div>
  );
}
