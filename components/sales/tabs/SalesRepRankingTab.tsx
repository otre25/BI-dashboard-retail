import React from 'react';
import { Trophy, ShieldAlert, Target, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { AlertCard } from '../shared/AlertCard';
import type { SalesRepData, SalesRepTableRow } from '../../../hooks/useSalesData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';


interface SalesRepRankingTabProps {
  data: SalesRepData;
  isLoading: boolean;
}

const columns: ColumnDef<SalesRepTableRow>[] = [
    { accessorKey: 'rank', header: '#', cell: info => <div className="flex items-center gap-2 font-bold">{info.getValue<number>()}{info.getValue<number>() <= 3 && <Trophy className="w-4 h-4 text-yellow-400"/>}</div> },
    { accessorKey: 'nome', header: 'Venditore', cell: info => <div className="font-medium">{info.getValue<string>()}</div> },
    { accessorKey: 'negozio', header: 'Negozio' },
    { accessorKey: 'leadGestiti', header: 'Lead Gestiti' },
    { accessorKey: 'vendite', header: 'Vendite' },
    { accessorKey: 'conversionRate', header: 'Conv. Rate', cell: info => `${info.getValue<number>().toFixed(1)}%` },
    { accessorKey: 'fatturato', header: 'Fatturato', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'scontrinoMedio', header: 'Scontrino Medio', cell: info => `€${info.getValue<number>().toLocaleString()}` },
];

export function SalesRepRankingTab({ data, isLoading }: SalesRepRankingTabProps) {
  if (isLoading) return <div>Loading sales rep data...</div>;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AlertCard title="Necessitano Training" items={data.alerts.needsTraining} emptyText="Nessun venditore con bassa performance." icon={<ShieldAlert className="w-5 h-5 text-yellow-400" aria-hidden="true" />} />
            <AlertCard title="Oltre Target" items={data.alerts.overTarget} emptyText="Nessun venditore ha superato il target." icon={<Target className="w-5 h-5 text-green-400" aria-hidden="true" />} />
            <AlertCard title="Inattivi (7gg)" items={data.alerts.inactive} emptyText="Tutti i venditori sono attivi." icon={<Moon className="w-5 h-5 text-gray-400" aria-hidden="true" />} />
        </div>

      <Card>
        <CardHeader><CardTitle>Classifica Venditori</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data.reps} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader><CardTitle>Top 10 Venditori per Fatturato</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.reps.slice(0,10)} margin={{left: 60}}>
                        <XAxis type="number" dataKey="fatturato" tickFormatter={(v) => `€${v/1000}k`} stroke="#9ca3af" fontSize={12} />
                        <YAxis type="category" dataKey="nome" width={60} stroke="#9ca3af" fontSize={12} interval={0} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} formatter={(value: number) => `€${value.toLocaleString()}`} />
                        <Bar dataKey="fatturato" fill="#22d3ee" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Conversion Rate vs Scontrino Medio</CardTitle></CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="conversionRate" name="Conv. Rate" unit="%" stroke="#9ca3af" fontSize={12}/>
                        <YAxis type="number" dataKey="scontrinoMedio" name="Scontrino Medio" unit="€" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                        <ZAxis type="number" dataKey="fatturato" range={[100, 1000]} name="Fatturato" unit="€" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} />
                        <Scatter name="Venditori" data={data.reps} fill="#8884d8" shape="circle" />
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}