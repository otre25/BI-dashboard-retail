import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { ChevronRight, ArrowDown } from 'lucide-react';

interface FunnelData {
  name: string;
  value: number;
  rate: number;
}

interface FunnelChartProps {
  data: FunnelData[];
  isLoading: boolean;
}

export function FunnelChart({ data, isLoading }: FunnelChartProps) {
  const colors = ["bg-cyan-500", "bg-teal-500", "bg-emerald-500", "bg-green-600"];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Funnel Conversione Lead</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="w-full h-full flex items-center justify-center">Loading...</div> :
        <div className="space-y-6">
          {data.map((stage, index) => (
            <React.Fragment key={stage.name}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                  <span className="font-medium text-gray-300">{stage.name}</span>
                </div>
                <span className="font-bold text-white text-lg">{stage.value.toLocaleString('it-IT')}</span>
              </div>
              
              {index < data.length - 1 && (
                <div className="flex items-center justify-center -my-3">
                  <ArrowDown className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-green-400 bg-gray-700/50 px-2 py-0.5 rounded-full mx-2">
                    {data[index + 1].rate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">conv.</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>}
      </CardContent>
    </Card>
  );
}
