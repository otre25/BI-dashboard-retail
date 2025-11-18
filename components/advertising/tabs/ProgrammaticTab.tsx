import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { type ProgrammaticData, type ProgrammaticPublisher } from '../../../hooks/useAdvertisingData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProgrammaticTabProps {
  data: ProgrammaticData;
  isLoading: boolean;
}

const publisherColumns: ColumnDef<ProgrammaticPublisher>[] = [
    { accessorKey: 'name', header: 'Publisher', cell: info => <span className="font-medium">{info.getValue<string>()}</span> },
    { accessorKey: 'impressions', header: 'Impressions', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'viewability', header: 'Viewability', cell: info => `${info.getValue<number>().toFixed(1)}%` },
    { accessorKey: 'clicks', header: 'Clicks', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'ctr', header: 'CTR', cell: info => `${info.getValue<number>().toFixed(2)}%` },
    { accessorKey: 'spend', header: 'Spesa', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'conversions', header: 'Conversioni', cell: info => info.getValue<number>().toLocaleString() },
    { accessorKey: 'roas', header: 'ROAS', cell: info => `${info.getValue<number>().toFixed(2)}x` },
];

const COLORS = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'];


export function ProgrammaticTab({ data, isLoading }: ProgrammaticTabProps) {
    if (isLoading) return <div>Loading Programmatic data...</div>;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader><CardTitle className="text-sm">Viewability Rate</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.viewability.toFixed(1)}%</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">CPM</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">€{data.kpis.cpm.toFixed(2)}</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">Video Completion</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.videoCompletionRate.toFixed(1)}%</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm">Brand Safety Score</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{data.kpis.brandSafetyScore.toFixed(1)}%</p></CardContent>
            </Card>
        </div>
      <Card>
        <CardHeader><CardTitle>Performance per Publisher</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={publisherColumns} data={data.publishers} />
        </CardContent>
      </Card>
       <Card>
        <CardHeader><CardTitle>Top 10 Publisher per Conversioni</CardTitle></CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.publishers.slice(0, 10).sort((a,b) => b.conversions - a.conversions)} layout="vertical" margin={{left: 100}}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} stroke="#9ca3af" fontSize={12} interval={0} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} />
                    <Bar dataKey="conversions" name="Conversioni" fill="#8b5cf6" barSize={20}>
                       {data.publishers.slice(0, 10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}