import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, differenceInDays, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

interface ComparisonData {
  current: {
    value: string;
    label: string;
  };
  previous: {
    value: string;
    label: string;
  };
  change: {
    percentage: string;
    isPositive: boolean;
    isNeutral: boolean;
  };
}

interface ComparisonViewProps {
  title: string;
  icon: React.ReactNode;
  data: ComparisonData;
  statusColor?: 'green' | 'yellow' | 'red';
}

export function ComparisonView({ title, icon, data, statusColor }: ComparisonViewProps) {
  const statusConfig = {
    green: { borderClass: 'border-green-500', label: 'Positivo' },
    yellow: { borderClass: 'border-yellow-500', label: 'Attenzione' },
    red: { borderClass: 'border-red-500', label: 'Critico' },
  };

  const currentStatus = statusColor ? statusConfig[statusColor] : null;

  const getComparisonIcon = () => {
    if (data.change.isNeutral) {
      return <Minus className="w-5 h-5 text-gray-400" aria-hidden="true" />;
    }
    return data.change.isPositive
      ? <TrendingUp className="w-5 h-5 text-green-400" aria-hidden="true" />
      : <TrendingDown className="w-5 h-5 text-red-400" aria-hidden="true" />;
  };

  const getChangeColor = () => {
    if (data.change.isNeutral) return 'text-gray-400';
    return data.change.isPositive ? 'text-green-400' : 'text-red-400';
  };

  return (
    <Card
      className={cn(
        statusColor && 'border-l-4',
        currentStatus?.borderClass,
        'transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10'
      )}
      role="article"
      aria-label={`Confronto ${title}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-400">
          {title}
          {currentStatus && (
            <span className="sr-only"> - Stato: {currentStatus.label}</span>
          )}
        </CardTitle>
        <span aria-hidden="true">{icon}</span>
      </CardHeader>
      <CardContent>
        {/* Comparison Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Period */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {data.current.label}
            </p>
            <p className="text-2xl font-bold text-white" aria-label={`Periodo corrente: ${data.current.value}`}>
              {data.current.value}
            </p>
          </div>

          {/* Previous Period */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {data.previous.label}
            </p>
            <p className="text-2xl font-bold text-gray-400" aria-label={`Periodo precedente: ${data.previous.value}`}>
              {data.previous.value}
            </p>
          </div>
        </div>

        {/* Change Indicator */}
        <div className={cn("flex items-center gap-2 mt-3 pt-3 border-t border-gray-700", getChangeColor())}>
          {getComparisonIcon()}
          <span className="text-sm font-medium">
            {data.change.percentage}
            <span className="sr-only">
              {data.change.isNeutral ? ' nessuna variazione' : data.change.isPositive ? ' in aumento' : ' in diminuzione'}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
