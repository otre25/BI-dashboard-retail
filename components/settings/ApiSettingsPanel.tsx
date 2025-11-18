import React, { useState } from 'react';
import { Settings, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { advertisingDataService } from '../../services/advertisingDataService';
import { ChannelApiConfig } from '../../types/api.types';

interface ChannelConfig {
  name: string;
  channel: 'meta' | 'google' | 'tiktok' | 'linkedin';
  icon: string;
  fields: {
    label: string;
    key: string;
    type: 'text' | 'password';
    placeholder: string;
  }[];
}

const channelConfigs: ChannelConfig[] = [
  {
    name: 'Meta Ads (Facebook/Instagram)',
    channel: 'meta',
    icon: '📘',
    fields: [
      { label: 'Access Token', key: 'accessToken', type: 'password', placeholder: 'EAAxxxxx...' },
      { label: 'Ad Account ID', key: 'accountId', type: 'text', placeholder: 'act_123456789' },
    ],
  },
  {
    name: 'Google Ads',
    channel: 'google',
    icon: '🔍',
    fields: [
      { label: 'Access Token', key: 'accessToken', type: 'password', placeholder: 'ya29.xxx...' },
      { label: 'Customer ID', key: 'accountId', type: 'text', placeholder: '1234567890' },
      { label: 'Client ID', key: 'clientId', type: 'text', placeholder: 'xxx.apps.googleusercontent.com' },
      { label: 'Client Secret', key: 'clientSecret', type: 'password', placeholder: 'GOCSPX-xxx...' },
    ],
  },
  {
    name: 'TikTok Ads',
    channel: 'tiktok',
    icon: '🎵',
    fields: [
      { label: 'Access Token', key: 'accessToken', type: 'password', placeholder: 'xxx...' },
      { label: 'Advertiser ID', key: 'accountId', type: 'text', placeholder: '1234567890123456' },
    ],
  },
];

export function ApiSettingsPanel() {
  const [configs, setConfigs] = useState<Map<string, Partial<ChannelApiConfig>>>(new Map());
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Map<string, boolean>>(new Map());
  const [showTokens, setShowTokens] = useState<Map<string, boolean>>(new Map());

  const handleFieldChange = (
    channel: string,
    field: string,
    value: string
  ) => {
    const updatedConfigs = new Map(configs);
    const channelConfig = updatedConfigs.get(channel) || {
      channel: channel as any,
      enabled: false,
      credentials: {},
    };

    channelConfig.credentials = {
      ...channelConfig.credentials,
      [field]: value,
    };

    updatedConfigs.set(channel, channelConfig);
    setConfigs(updatedConfigs);
  };

  const toggleEnabled = (channel: string) => {
    const updatedConfigs = new Map(configs);
    const channelConfig = updatedConfigs.get(channel) || {
      channel: channel as any,
      enabled: false,
      credentials: {},
    };

    channelConfig.enabled = !channelConfig.enabled;
    updatedConfigs.set(channel, channelConfig);
    setConfigs(updatedConfigs);
  };

  const testConnection = async (channel: 'meta' | 'google' | 'tiktok') => {
    setTestingChannel(channel);

    const channelConfig = configs.get(channel);
    if (channelConfig) {
      advertisingDataService.configureChannel(channelConfig as ChannelApiConfig);
    }

    const result = await advertisingDataService.testConnection(channel);

    const updatedResults = new Map(testResults);
    updatedResults.set(channel, result);
    setTestResults(updatedResults);
    setTestingChannel(null);
  };

  const saveConfiguration = () => {
    configs.forEach((config, channel) => {
      if (config.enabled) {
        advertisingDataService.configureChannel(config as ChannelApiConfig);
      }
    });

    alert('Configurazione salvata con successo!');
  };

  const toggleShowToken = (channel: string, field: string) => {
    const key = `${channel}_${field}`;
    const updated = new Map(showTokens);
    updated.set(key, !updated.get(key));
    setShowTokens(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-cyan-500/20 rounded-lg">
          <Settings className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Configurazione API</h2>
          <p className="text-sm text-gray-400">
            Configura le credenziali per sincronizzare i dati dai canali pubblicitari
          </p>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-300">
          <strong>Nota:</strong> Le credenziali vengono salvate localmente nel browser.
          Per la produzione, si consiglia di gestire i token tramite un backend sicuro.
        </p>
      </div>

      {channelConfigs.map((channelConfig) => {
        const config = configs.get(channelConfig.channel);
        const isEnabled = config?.enabled || false;
        const testResult = testResults.get(channelConfig.channel);
        const isTesting = testingChannel === channelConfig.channel;

        return (
          <div
            key={channelConfig.channel}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{channelConfig.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {channelConfig.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isEnabled ? 'Attivo' : 'Non attivo'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleEnabled(channelConfig.channel)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {isEnabled && (
              <div className="space-y-4 mt-4">
                {channelConfig.fields.map((field) => {
                  const showKey = `${channelConfig.channel}_${field.key}`;
                  const showPassword = showTokens.get(showKey);

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          type={field.type === 'password' && !showPassword ? 'password' : 'text'}
                          placeholder={field.placeholder}
                          value={config?.credentials?.[field.key] || ''}
                          onChange={(e) =>
                            handleFieldChange(
                              channelConfig.channel,
                              field.key,
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => toggleShowToken(channelConfig.channel, field.key)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => testConnection(channelConfig.channel)}
                    disabled={isTesting}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      'bg-gray-700 text-gray-300 hover:bg-gray-600',
                      isTesting && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Test in corso...</span>
                      </>
                    ) : (
                      <span>Testa Connessione</span>
                    )}
                  </button>

                  {testResult !== undefined && (
                    <div className="flex items-center gap-2">
                      {testResult ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-sm text-green-400">Connessione riuscita</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-sm text-red-400">Connessione fallita</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={saveConfiguration}
          className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
        >
          Salva Configurazione
        </button>
      </div>
    </div>
  );
}
