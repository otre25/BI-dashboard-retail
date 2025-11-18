import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { type MetaData, type MetaCampaign } from '../../../hooks/useAdvertisingData';
// FIX: Added Legend to the import from recharts
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface MetaAdsTabProps {
  data: MetaData;
  isLoading: boolean;
}

const columns: ColumnDef<MetaCampaign>[] = [
    { accessorKey: 'name', header: 'Campagna', cell: info => <span className="font-medium">{info.getValue<string>()}</span> },
    { accessorKey: 'status', header: 'Stato', cell: info => <div className={`px-2 py-0.5 rounded-full text-xs inline-block ${info.getValue<string>() === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{info.getValue<string>()}</div> },
    { accessorKey: 'daily_budget', header: 'Budget Giornaliero', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'spend', header: 'Spesa', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'results', header: 'Risultati (Lead)', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'cost_per_result', header: 'Costo/Risultato', cell: info => `€${info.getValue<number>().toFixed(2)}` },
    { accessorKey: 'roas', header: 'ROAS', cell: info => `${info.getValue<number>().toFixed(2)}x` },
];

const AGE_COLORS = ['#16a34a', '#15803d', '#166534', '#14532d', '#052e16'];
const GENDER_COLORS = ['#1d4ed8', '#be185d'];

export function MetaAdsTab({ data, isLoading }: MetaAdsTabProps) {
    if (isLoading) return <div>Loading Meta Ads data...</div>;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader><CardTitle className="text-sm">Reach</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.reach.toLocaleString()}</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">Frequency</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.frequency.toFixed(2)}</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">Engagement Rate</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.engagementRate.toFixed(2)}%</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">CPL Form</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">€{data.kpis.costPerLeadForm.toFixed(2)}</p></CardContent>
            </Card>
        </div>
      <Card>
        <CardHeader><CardTitle>Performance Campagne Meta</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data.campaigns} />
        </CardContent>
      </Card>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Performance per Età</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.demographics.byAge} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="age" width={60} stroke="#9ca3af" fontSize={12}/>
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} />
                        <Bar dataKey="leads" name="Leads" fill="#22c55e" barSize={20}>
                            {data.demographics.byAge.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Performance per Genere</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={data.demographics.byGender} dataKey="leads" nameKey="gender" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label>
                            {data.demographics.byGender.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}