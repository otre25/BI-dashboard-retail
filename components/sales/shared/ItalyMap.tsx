import React from 'react';
import type { MapStoreData } from '../../../types';
import { Euro, TrendingUp, Store, BarChart3 } from 'lucide-react';

interface ItalyMapProps {
  stores: MapStoreData[];
}

export function ItalyMap({ stores }: ItalyMapProps) {
  const maxFatturato = stores.length > 0 ? Math.max(...stores.map(s => s.fatturato)) : 1;
  const minFatturato = stores.length > 0 ? Math.min(...stores.map(s => s.fatturato)) : 0;

  const getPerformanceColor = (fatturato: number) => {
    const normalized = (fatturato - minFatturato) / (maxFatturato - minFatturato || 1);
    if (normalized >= 0.75) return { bg: '#10b981', text: 'Eccellente', gradient: 'from-green-500 to-green-600' };
    if (normalized >= 0.5) return { bg: '#06b6d4', text: 'Buona', gradient: 'from-cyan-500 to-cyan-600' };
    if (normalized >= 0.25) return { bg: '#f59e0b', text: 'Media', gradient: 'from-yellow-500 to-yellow-600' };
    return { bg: '#ef4444', text: 'Da migliorare', gradient: 'from-red-500 to-red-600' };
  };

  // Estrai nome breve del negozio (es. "Milano Centro" da "Cucine Milano Centro")
  const getShortName = (nome: string) => {
    return nome.replace('Cucine ', '');
  };

  return (
    <div
      className="relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden"
      role="region"
      aria-label={`Panoramica dei ${stores.length} negozi in Italia`}
    >
      {/* Header con contatore e legenda */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700/50">
        <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5">
          <span className="text-sm font-semibold text-white">{stores.length} Punti Vendita</span>
        </div>

        {/* Legenda compatta */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-300 font-medium">Top</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-xs text-gray-300 font-medium">Buona</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-300 font-medium">Media</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-300 font-medium">Bassa</span>
          </div>
        </div>
      </div>

      {/* Istruzioni */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs text-gray-500 italic">Passa il mouse sulle card per vedere i KPI dettagliati</p>
      </div>

      {/* Store flashcards grid */}
      <div className="p-4 pt-2">
        <div className="grid grid-cols-5 gap-4">
          {stores.map(store => {
            const performance = getPerformanceColor(store.fatturato);
            const shortName = getShortName(store.nome);

            return (
              <div
                key={store.id}
                className="group perspective-1000"
                style={{ perspective: '1000px' }}
              >
                <div
                  className="relative w-full h-[180px] transition-transform duration-500 ease-in-out group-hover:[transform:rotateY(180deg)]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* FRONTE - Info negozio */}
                  <div
                    className="absolute inset-0 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Performance indicator bar */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-lg bg-gradient-to-r ${performance.gradient}`}
                    />

                    {/* Store icon */}
                    <div className="flex justify-center mb-3 mt-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${performance.bg}25` }}
                      >
                        <Store className="w-5 h-5" style={{ color: performance.bg }} />
                      </div>
                    </div>

                    {/* Store name */}
                    <div className="text-center mb-3">
                      <p className="text-sm font-bold text-white leading-tight mb-1">
                        {shortName}
                      </p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                        {store.citta}
                      </p>
                    </div>

                    {/* Quick KPI */}
                    <div className="pt-3 border-t border-gray-600">
                      <p className="text-base font-bold text-center" style={{ color: performance.bg }}>
                        €{(store.fatturato / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>

                  {/* RETRO - KPI dettagliati */}
                  <div
                    className="absolute inset-0 bg-gray-800 border border-cyan-500/50 rounded-lg p-3 shadow-lg shadow-cyan-500/10 overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    {/* Performance indicator bar */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-lg bg-gradient-to-r ${performance.gradient}`}
                    />

                    {/* Header compatto */}
                    <div className="text-center mb-2 mt-1">
                      <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider truncate">
                        {shortName}
                      </p>
                    </div>

                    {/* KPIs - layout verticale compatto */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <Euro className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-400">Fatturato</span>
                        </div>
                        <p className="text-xs font-bold text-white pl-4">
                          €{(store.fatturato / 1000).toFixed(0)}k
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <TrendingUp className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-400">€/m²</span>
                        </div>
                        <p className="text-xs font-bold text-white pl-4">
                          €{store.profitabilitaPerMq.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <BarChart3 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-400">Perf.</span>
                        </div>
                        <p
                          className="text-[10px] font-bold pl-4"
                          style={{ color: performance.bg }}
                        >
                          {performance.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
