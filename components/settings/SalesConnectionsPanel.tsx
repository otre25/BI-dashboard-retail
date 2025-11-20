import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, XCircle, Plus, Link2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SalesSourceType } from '../../types/salesConnections.types';

interface SalesConnectionsPanelProps {
  companyId: string;
}

const SALES_SOURCES: { type: SalesSourceType; name: string; description: string; color: string }[] = [
  {
    type: 'airtable',
    name: 'Airtable',
    description: 'Database flessibile per vendite e inventario',
    color: 'yellow',
  },
  {
    type: 'google_sheets',
    name: 'Google Sheets',
    description: 'Fogli di calcolo Google per tracking vendite',
    color: 'green',
  },
  {
    type: 'notion',
    name: 'Notion',
    description: 'Database Notion per gestione ordini',
    color: 'gray',
  },
  {
    type: 'shopify',
    name: 'Shopify',
    description: 'E-commerce Shopify',
    color: 'green',
  },
  {
    type: 'woocommerce',
    name: 'WooCommerce',
    description: 'E-commerce WordPress',
    color: 'purple',
  },
  {
    type: 'teamsystem',
    name: 'TeamSystem',
    description: 'ERP italiano (prossimamente)',
    color: 'blue',
  },
  {
    type: 'csv_auto',
    name: 'File CSV/Excel',
    description: 'Import manuale con rilevamento automatico',
    color: 'cyan',
  },
];

export function SalesConnectionsPanel({ companyId }: SalesConnectionsPanelProps) {
  const [selectedSource, setSelectedSource] = useState<SalesSourceType | null>(null);

  const renderSourceCard = (source: typeof SALES_SOURCES[0]) => {
    const isAvailable = ['airtable', 'google_sheets', 'notion', 'shopify', 'woocommerce', 'csv_auto'].includes(source.type);

    return (
      <div
        key={source.type}
        className={cn(
          'bg-gray-800 border border-gray-700 rounded-lg p-6 transition-all',
          isAvailable ? 'hover:border-gray-600 cursor-pointer' : 'opacity-50'
        )}
        onClick={() => isAvailable && setSelectedSource(source.type)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100 mb-1">{source.name}</h3>
            <p className="text-sm text-gray-400">{source.description}</p>
          </div>
          {isAvailable && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Connetti
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Connessioni Dati Vendite</h2>
        <p className="text-gray-400 mt-1">
          Collega i tuoi gestionali per sincronizzazione automatica delle vendite
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShoppingCart className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-cyan-400 mb-1">
              Riconoscimento Automatico Campi
            </h3>
            <p className="text-xs text-gray-400">
              Il sistema rileva automaticamente i campi delle vendite (data, importo, prodotto, cliente, etc.) da qualsiasi fonte dati. Non serve configurazione manuale!
            </p>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SALES_SOURCES.map((source) => renderSourceCard(source))}
      </div>

      {/* Help Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-cyan-400" />
          Come Funziona
        </h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div>
            <strong className="text-gray-300">1. Connetti la sorgente:</strong> Inserisci le credenziali API o carica un file
          </div>
          <div>
            <strong className="text-gray-300">2. Rilevamento automatico:</strong> Il sistema analizza i dati e riconosce i campi (data, importo, negozio, prodotto, etc.)
          </div>
          <div>
            <strong className="text-gray-300">3. Verifica anteprima:</strong> Controlla la mappatura suggerita prima dell'import
          </div>
          <div>
            <strong className="text-gray-300">4. Sincronizzazione:</strong> I dati vengono automaticamente aggiornati e visualizzati nella dashboard
          </div>
        </div>
      </div>

      {/* Modal placeholder */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              Configura {SALES_SOURCES.find((s) => s.type === selectedSource)?.name}
            </h3>
            <p className="text-gray-400 mb-6">
              Feature in fase di completamento. Il riconoscimento automatico è già implementato nei servizi backend.
            </p>
            <button
              onClick={() => setSelectedSource(null)}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
