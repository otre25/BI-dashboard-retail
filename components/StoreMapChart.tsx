import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { ItalyMap } from './sales/shared/ItalyMap';
import { MapPin } from 'lucide-react';
import type { MapStoreData } from '../types';

interface StoreMapChartProps {
  data: MapStoreData[];
  isLoading: boolean;
}

export function StoreMapChart({ data, isLoading }: StoreMapChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <span>Mappa Negozi e KPI</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-80 flex items-center justify-center" role="status" aria-busy="true">
            <p className="text-gray-500">Caricamento mappa...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-80 flex items-center justify-center">
            <p className="text-gray-500">Nessun negozio trovato per i filtri selezionati.</p>
          </div>
        ) : (
          <div className="w-full">
            <ItalyMap stores={data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
