import React, { useState } from 'react';
import { Award, TrendingDown, MapPin, BarChartHorizontal, DownloadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { StoreDetailModal } from '../StoreDetailModal';
import { ItalyMap } from '../shared/ItalyMap';
import type { StorePerformanceData, StoreTableRow } from '../../../hooks/useSalesData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ExportModal } from '../../shared/ExportModal';

interface StoresPerformanceTabProps {
  data: StorePerformanceData;
  isLoading: boolean;
}

const getBadge = (rank: number) => {
    if (rank === 1) return <Award className="w-5 h-5 text-yellow-400" title="Gold" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-300" title="Silver" />;
    if (rank === 3) return <Award className="w-5 h-5 text-yellow-600" title="Bronze" />;
    return null;
};

export function StoresPerformanceTab({ data, isLoading }: StoresPerformanceTabProps) {
  const [selectedStore, setSelectedStore] = useState<StoreTableRow | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const columns: ColumnDef<StoreTableRow>[] = [
    { accessorKey: 'rank', header: '#', cell: ({row}) => <div className="flex items-center gap-2">{row.original.rank} {getBadge(row.original.rank)}</div> },
    { accessorKey: 'nome', header: 'Negozio', cell: info => <div className="font-medium">{info.getValue<string>()}</div> },
    { accessorKey: 'citta', header: 'Città' },
    { accessorKey: 'manager', header: 'Manager' },
    { accessorKey: 'fatturato', header: 'Fatturato', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'scontrinoMedio', header: 'Scontrino Medio', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'tassoChiusura', header: 'Tasso Chiusura', cell: info => `${info.getValue<number>().toFixed(1)}%` },
    { accessorKey: 'profitabilitaPerMq', header: '€/m²', cell: ({row}) => (
        <div className={`font-bold ${row.original.isUnderperforming ? 'text-red-400' : 'text-green-400'}`}>
            €{row.original.profitabilitaPerMq.toLocaleString()}
        </div>
    )},
    {id: 'actions', header: 'Azioni', cell: ({ row }) => (
        <button onClick={() => setSelectedStore(row.original)} className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
          Dettaglio
        </button>
      ),
    },
];

  if (isLoading) return <div>Loading store performance data...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Performance Negozi</CardTitle>
            <button 
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 bg-gray-700 px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                <DownloadCloud className="w-4 h-4" />
                Advanced Export
            </button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data.stores} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChartHorizontal className="w-5 h-5 text-cyan-400" /> Classifica Negozi per Redditività (€/m²)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.stores.slice(0, 10).sort((a,b) => b.profitabilitaPerMq - a.profitabilitaPerMq)} layout="vertical" margin={{left: 100}}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="citta" width={100} stroke="#9ca3af" fontSize={12} interval={0} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} formatter={(value: number) => `€${value.toLocaleString()}`} />
                        <Bar dataKey="profitabilitaPerMq" name="€/m²" barSize={20}>
                            {data.stores.slice(0, 10).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isUnderperforming ? '#ef4444' : '#22c55e'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" /> Mappa Fatturato Negozi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full h-[400px] flex items-center justify-center">
                    <ItalyMap stores={data.stores} />
                </div>
            </CardContent>
        </Card>
      </div>

      {selectedStore && (
        <StoreDetailModal
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          storeDetails={data.details[selectedStore.id]}
        />
      )}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={data.stores}
        columns={columns.filter(c => c.accessorKey)} // Exclude action columns from export
        filename="store_performance_export.csv"
      />
    </div>
  );
}