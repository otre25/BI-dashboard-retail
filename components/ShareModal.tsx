import React, { useState } from 'react';
import { X, Link2, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export function ShareModal({ isOpen, onClose, shareUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-labelledby="share-modal-title"
      aria-modal="true"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Link2 className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 id="share-modal-title" className="text-xl font-semibold text-white">
              Condividi Dashboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-300">
            Condividi questo link per permettere ad altri di visualizzare la dashboard con le stesse impostazioni,
            filtri e visualizzazioni che stai vedendo ora.
          </p>

          {/* URL Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Link di condivisione
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 overflow-x-auto whitespace-nowrap">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  'px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap',
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                )}
                aria-label={copied ? 'Link copiato' : 'Copia link'}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copia</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-cyan-400 mb-2">
              Cosa viene condiviso:
            </h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Intervallo di date selezionato</li>
              <li>• Negozi e canali filtrati</li>
              <li>• Ordine dei grafici personalizzato</li>
              <li>• Grafici espansi</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
