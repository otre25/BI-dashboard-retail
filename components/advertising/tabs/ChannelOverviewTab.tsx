import React from 'react';
import { TrendingUp, TrendingDown, Facebook, Globe, Bot } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { type OverviewData, type OverviewTableRow } from '../../../hooks/useAdvertisingData';

interface ChannelOverviewTabProps {
  data: OverviewData;
  isLoading: boolean;
}

const ICONS: { [key: string]: React.ReactNode } = {
  Meta: <Facebook className="w-5 h-5 text-blue-500" />,
  Google: <Globe className="w-5 h-5 text-green-500" />,
  Programmatic: <Bot className="w-5 h-5 text-purple-500" />,
};
const COLORS = { Meta: '#3b82f6', Google: '#22c55e', Programmatic: '#8b5cf6' };
const PIE_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6'];

const columns: ColumnDef<OverviewTableRow>[] = [
    { accessorKey: 'canale', header: 'Canale', cell: info => <div className="flex items-center gap-2 font-medium">{ICONS[info.getValue<string>()]} {info.getValue<string>()}</div> },
    { accessorKey: 'spesa', header: 'Spesa', cell: info => `€${info.getValue<number>().toLocaleString('it-IT', { maximumFractionDigits: 0 })}` },
    { accessorKey: 'impression', header: 'Impression', cell: info => info.getValue<number>().toLocaleString('it-IT') },
    { accessorKey: 'click', header: 'Click', cell: info => info.getValue<number>().toLocaleString('it-IT') },
    { accessorKey: 'ctr', header: 'CTR', cell: info => `${info.getValue<number>().toFixed(2)}%` },
    { accessorKey: 'cpc', header: 'CPC', cell: info => `€${info.getValue<number>().toFixed(2)}` },
    { accessorKey: 'lead', header: 'Lead', cell: info => info.getValue<number>().toLocaleString('it-IT') },
    { accessorKey: 'cpl', header: 'CPL', cell: info => `€${info.getValue<number>().toFixed(2)}` },
    { accessorKey: 'conversioni', header: 'Vendite', cell: info => info.getValue<number>().toLocaleString('it-IT') },
    { accessorKey: 'roas', header: 'ROAS', cell: info => `${info.getValue<number>().toFixed(2)}x` },
    { accessorKey: 'fatturato', header: 'Fatturato', cell: info => `€${info.getValue<number>().toLocaleString('it-IT', { maximumFractionDigits: 0 })}` },
];


export function ChannelOverviewTab({ data, isLoading }: ChannelOverviewTabProps) {
  if (isLoading) return <div>Loading advertising data...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Performance Comparativa Canali</CardTitle></CardHeader>
        <CardContent>
            <DataTable columns={columns} data={data.tableData} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader><CardTitle>Spesa Giornaliera per Canale (30gg)</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.dailySpend}>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={val => `€${val/1000}k`} />
                        <Area type="monotone" dataKey="Meta" stackId="1" stroke={COLORS.Meta} fill={COLORS.Meta} fillOpacity={0.6} />
                        <Area type="monotone" dataKey="Google" stackId="1" stroke={COLORS.Google} fill={COLORS.Google} fillOpacity={0.6} />
                        <Area type="monotone" dataKey="Programmatic" stackId="1" stroke={COLORS.Programmatic} fill={COLORS.Programmatic} fillOpacity={0.6} />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Distribuzione Budget</CardTitle></CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={data.budgetDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {data.budgetDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend />
                        <Tooltip formatter={(value: number) => `€${value.toLocaleString()}`}/>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle>ROAS Trend per Canale (90gg)</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.roasTrend}>
                         <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                         <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={val => `${val}x`} domain={[0, 'dataMax + 1']}/>
                         <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} formatter={(value: number) => `${value.toFixed(2)}x`}/>
                         <Legend />
                         <Line type="monotone" dataKey="Meta" stroke={COLORS.Meta} strokeWidth={2} dot={false} />
                         <Line type="monotone" dataKey="Google" stroke={COLORS.Google} strokeWidth={2} dot={false} />
                         <Line type="monotone" dataKey="Programmatic" stroke={COLORS.Programmatic} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}