import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineProps {
  data: { date: string; value: number }[];
  dataKey: string;
  strokeColor: string;
}

export function Sparkline({ data, dataKey, strokeColor }: SparklineProps) {
  return (
    <div className="w-full h-12 -mx-3">
      <ResponsiveContainer>
        <LineChart data={data}>
           <Tooltip
                contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                    borderColor: '#374151', 
                    fontSize: '12px', 
                    padding: '4px 8px',
                    borderRadius: '0.5rem',
                }}
                labelStyle={{ display: 'none' }}
                itemStyle={{ color: '#e5e7eb' }}
                formatter={(value: number) => [`€${value.toLocaleString('it-IT', {maximumFractionDigits:0})}`,""]}
            />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
