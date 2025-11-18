import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface TrendData {
  date: string;
  Spesa: number;
  Fatturato: number;
}

interface TrendChartProps {
  data: TrendData[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const spesa = payload.find((p: any) => p.dataKey === 'Spesa')?.value || 0;
    const fatturato = payload.find((p: any) => p.dataKey === 'Fatturato')?.value || 0;
    const roas = spesa > 0 ? (fatturato / spesa).toFixed(2) : '∞';

    return (
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-sm">
        <p className="label text-gray-300 font-bold">{`${label}`}</p>
        <p className="intro text-cyan-400">{`Fatturato: €${fatturato.toLocaleString('it-IT')}`}</p>
        <p className="intro text-red-400">{`Spesa: €${spesa.toLocaleString('it-IT')}`}</p>
        <p className="intro text-green-400 font-semibold">{`ROAS: ${roas}x`}</p>
      </div>
    );
  }
  return null;
};

export function TrendChart({ data, isLoading }: TrendChartProps) {
  return (
    <Card className="h-full col-span-1 xl:col-span-2">
      <CardHeader>
        <CardTitle>Trend Fatturato vs Spesa ADV</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
            {isLoading ? <div className="w-full h-full flex items-center justify-center">Loading...</div> :
            <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: 20, bottom: 40 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#22d3ee" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${Number(value)/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#f87171" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${Number(value)/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "14px", bottom: 0}} />
                <Line yAxisId="left" type="monotone" dataKey="Fatturato" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="Spesa" stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Brush dataKey="date" height={30} stroke="#8884d8" fill="rgba(31, 41, 55, 0.5)" travellerWidth={15} />
            </LineChart>
            </ResponsiveContainer>}
        </div>
      </CardContent>
    </Card>
  );
}
