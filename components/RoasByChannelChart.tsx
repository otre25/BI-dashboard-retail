import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface RoasData {
  name: string;
  ROAS: number;
}

interface ChannelROASChartProps {
  data: RoasData[];
  isLoading: boolean;
}

const TARGET_ROAS = 2.5;
const COLORS = ['#22d3ee', '#14b8a6', '#6366f1'];

const getPath = (x: number, y: number, width: number, height: number) => {
  return `M${x},${y + height}C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3}
  ${x + width / 2}, ${y}
  C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width}, ${y + height}
  Z`;
};

const TriangleBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
};


export function ChannelROASChart({ data, isLoading }: ChannelROASChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>ROAS per Canale</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          {isLoading ? <div className="w-full h-full flex items-center justify-center">Loading...</div> :
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toFixed(1)}x`}/>
                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(31, 41, 55, 0.8)',
                        borderColor: '#4b5563',
                        borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#d1d5db' }}
                    formatter={(value: number) => [`${value.toFixed(2)}x`, "ROAS"]}
                />
                <ReferenceLine x={TARGET_ROAS} stroke="#a78bfa" strokeDasharray="4 4" >
                    <Legend content={<div className="text-xs text-purple-400">Target</div>} position="top" />
                </ReferenceLine>
                <Bar dataKey="ROAS" fill="#14b8a6" barSize={25}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.ROAS >= TARGET_ROAS ? '#14b8a6' : entry.ROAS > TARGET_ROAS * 0.6 ? '#f59e0b' : '#ef4444'} />
                    ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>}
        </div>
      </CardContent>
    </Card>
  );
}
