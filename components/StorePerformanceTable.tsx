import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface HeatmapData {
  id: number;
  nome: string;
  citta: string;
  fatturato: number;
  profitabilitaPerMq: number;
}

interface StoresHeatmapProps {
  data: HeatmapData[];
  isLoading: boolean;
}

const getColorForValue = (value: number, min: number, max: number): string => {
  if (max === min) return 'bg-teal-600';
  const ratio = (value - min) / (max - min);
  if (ratio < 0.2) return 'bg-red-800 hover:bg-red-700';
  if (ratio < 0.4) return 'bg-yellow-700 hover:bg-yellow-600';
  if (ratio < 0.6) return 'bg-teal-700 hover:bg-teal-600';
  if (ratio < 0.8) return 'bg-teal-600 hover:bg-teal-500';
  return 'bg-green-500 hover:bg-green-400';
};

export function StoresHeatmap({ data, isLoading }: StoresHeatmapProps) {
  const values = data.map(d => d.profitabilitaPerMq);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Heatmap Redditività Negozi (€/m²)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="w-full h-full flex items-center justify-center">Loading...</div> :
        <div className="grid grid-cols-5 grid-rows-3 gap-2 h-80">
          {data.map((store) => (
            <div key={store.id} 
                 className={`group relative rounded-lg flex flex-col items-center justify-center p-2 text-center text-white font-bold transition-all duration-300 ${getColorForValue(store.profitabilitaPerMq, min, max)}`}
            >
              <span className="text-xs sm:text-sm truncate">{store.citta}</span>
              <span className="text-base sm:text-lg">€{store.profitabilitaPerMq.toFixed(0)}</span>
              
              <div className="absolute z-10 bottom-full mb-2 w-max p-2 text-xs text-left bg-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="font-bold text-white">{store.nome}</p>
                <p>Fatturato: €{store.fatturato.toLocaleString('it-IT')}</p>
                <p>Redditività/m²: €{store.profitabilitaPerMq.toLocaleString('it-IT', {minimumFractionDigits: 2})}</p>
              </div>
            </div>
          ))}
        </div>}
      </CardContent>
    </Card>
  );
}
