import { useState, useEffect } from 'react';
import { Database, Plus, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { dataSourceService } from '../../services/dataSourceService';
import type { DataSourceConfig, DataSourceType } from '../../types/datasource.types';

export function DataSourcePanel() {
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    dataSourceService.loadFromLocalStorage();
    loadDataSources();
  }, []);

  const loadDataSources = () => {
    setDataSources(dataSourceService.getAllDataSources());
  };

  const handleTestConnection = async (config: DataSourceConfig) => {
    setTestingConnection(config.id);
    const success = await dataSourceService.testConnection(config);
    setTestingConnection(null);

    if (success) {
      alert(`✅ Connessione riuscita a ${config.name}`);
    } else {
      alert(`❌ Connessione fallita a ${config.name}`);
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    const result = await dataSourceService.importFromSource(id);
    setSyncing(null);
    loadDataSources();

    if (result.success) {
      alert(`✅ Importati ${result.recordsImported} record da ${result.source}`);
    } else {
      alert(`❌ Errore durante l'importazione: ${result.errors?.join(', ')}`);
    }
  };

  const handleToggle = (config: DataSourceConfig) => {
    const updated = { ...config, enabled: !config.enabled };
    dataSourceService.addDataSource(updated);
    loadDataSources();
  };

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa sorgente dati?')) {
      dataSourceService.removeDataSource(id);
      loadDataSources();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sorgenti Dati</h2>
            <p className="text-sm text-gray-500">
              Collega Airtable, Notion o Google Sheets
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Sorgente
        </button>
      </div>

      {dataSources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessuna sorgente dati configurata
          </h3>
          <p className="text-gray-500 mb-4">
            Inizia collegando Airtable, Notion o Google Sheets
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Aggiungi Prima Sorgente
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {dataSources.map(source => (
            <DataSourceCard
              key={source.id}
              config={source}
              onTest={handleTestConnection}
              onSync={handleSync}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isTesting={testingConnection === source.id}
              isSyncing={syncing === source.id}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddDataSourceModal
          onClose={() => setShowAddModal(false)}
          onAdd={(config) => {
            dataSourceService.addDataSource(config);
            loadDataSources();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface DataSourceCardProps {
  config: DataSourceConfig;
  onTest: (config: DataSourceConfig) => void;
  onSync: (id: string) => void;
  onToggle: (config: DataSourceConfig) => void;
  onDelete: (id: string) => void;
  isTesting: boolean;
  isSyncing: boolean;
}

function DataSourceCard({
  config,
  onTest,
  onSync,
  onToggle,
  onDelete,
  isTesting,
  isSyncing,
}: DataSourceCardProps) {
  const typeLabels: Record<DataSourceType, string> = {
    airtable: 'Airtable',
    notion: 'Notion',
    googlesheets: 'Google Sheets',
    excel: 'Excel',
  };

  const typeColors: Record<DataSourceType, string> = {
    airtable: 'bg-orange-100 text-orange-700',
    notion: 'bg-gray-100 text-gray-700',
    googlesheets: 'bg-green-100 text-green-700',
    excel: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[config.type]}`}>
            {typeLabels[config.type]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
            {config.lastSync && (
              <p className="text-sm text-gray-500">
                Ultimo sync: {new Date(config.lastSync).toLocaleString('it-IT')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(config)}
            className={`p-2 rounded-lg transition-colors ${
              config.enabled
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={config.enabled ? 'Disabilita' : 'Abilita'}
          >
            {config.enabled ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => onDelete(config.id)}
            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            title="Elimina"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onTest(config)}
          disabled={isTesting || !config.enabled}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Test in corso...
            </>
          ) : (
            'Testa Connessione'
          )}
        </button>
        <button
          onClick={() => onSync(config.id)}
          disabled={isSyncing || !config.enabled}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sincronizzazione...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sincronizza
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface AddDataSourceModalProps {
  onClose: () => void;
  onAdd: (config: DataSourceConfig) => void;
}

function AddDataSourceModal({ onClose, onAdd }: AddDataSourceModalProps) {
  const [type, setType] = useState<DataSourceType>('airtable');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: DataSourceConfig = {
      id: `ds-${Date.now()}`,
      type,
      name,
      enabled: true,
      credentials,
      mappings: [],
    };

    onAdd(config);
  };

  const renderCredentialFields = () => {
    switch (type) {
      case 'airtable':
        return (
          <>
            <input
              type="text"
              placeholder="Base ID"
              value={credentials.baseId || ''}
              onChange={(e) => setCredentials({ ...credentials, baseId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Table ID"
              value={credentials.tableId || ''}
              onChange={(e) => setCredentials({ ...credentials, tableId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="API Key"
              value={credentials.apiKey || ''}
              onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </>
        );
      case 'notion':
        return (
          <>
            <input
              type="text"
              placeholder="Database ID"
              value={credentials.databaseId || ''}
              onChange={(e) => setCredentials({ ...credentials, databaseId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="Access Token"
              value={credentials.accessToken || ''}
              onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </>
        );
      case 'googlesheets':
        return (
          <>
            <input
              type="text"
              placeholder="Spreadsheet ID"
              value={credentials.spreadsheetId || ''}
              onChange={(e) => setCredentials({ ...credentials, spreadsheetId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="Access Token"
              value={credentials.accessToken || ''}
              onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Aggiungi Sorgente Dati
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo di Sorgente
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as DataSourceType);
                setCredentials({});
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="airtable">Airtable</option>
              <option value="notion">Notion</option>
              <option value="googlesheets">Google Sheets</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome della sorgente"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credenziali
            </label>
            <div className="space-y-3">
              {renderCredentialFields()}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aggiungi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
