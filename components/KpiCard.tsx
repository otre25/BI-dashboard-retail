import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Sparkline } from './ui/Sparkline';
import { KpiDetailModal } from './KpiDetailModal';

type ComparisonColor = 'text-green-400' | 'text-red-400' | 'text-gray-400';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  comparison?: {
    change: string;
    color: ComparisonColor;
  };
  sparklineData?: { date: string; value: number }[];
  statusColor?: 'green' | 'yellow' | 'red';
}

export function KpiCard({ title, value, icon, comparison, sparklineData, statusColor }: KpiCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusConfig = {
    green: { borderClass: 'border-green-500', label: 'Positivo' },
    yellow: { borderClass: 'border-yellow-500', label: 'Attenzione' },
    red: { borderClass: 'border-red-500', label: 'Critico' },
  };

  const currentStatus = statusColor ? statusConfig[statusColor] : null;
  const cardId = `kpi-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const getComparisonIcon = () => {
    if (comparison?.color === 'text-green-400') {
      return <TrendingUp className="w-4 h-4 mr-1" aria-hidden="true" />;
    } else if (comparison?.color === 'text-red-400') {
      return <TrendingDown className="w-4 h-4 mr-1" aria-hidden="true" />;
    }
    return <Minus className="w-4 h-4 mr-1" aria-hidden="true" />;
  };

  const getComparisonLabel = () => {
    if (comparison?.color === 'text-green-400') return 'in aumento';
    if (comparison?.color === 'text-red-400') return 'in diminuzione';
    return 'stabile';
  };

  // Mock breakdown data for drill-down
  const mockBreakdown = [
    { label: 'Milano Centro', value: '€45.230', percentage: 85 },
    { label: 'Roma Termini', value: '€38.120', percentage: 72 },
    { label: 'Napoli Vomero', value: '€32.450', percentage: 61 },
    { label: 'Torino Re Umberto', value: '€28.900', percentage: 55 },
    { label: 'Firenze SMN', value: '€25.300', percentage: 48 },
  ];

  const mockTrend = [
    { period: 'Lun', value: 12500 },
    { period: 'Mar', value: 15800 },
    { period: 'Mer', value: 14200 },
    { period: 'Gio', value: 18900 },
    { period: 'Ven', value: 21300 },
    { period: 'Sab', value: 24100 },
    { period: 'Dom', value: 16400 },
  ];

  return (
    <>
      <Card
        className={cn(
          statusColor && 'border-l-4',
          currentStatus?.borderClass,
          'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/50'
        )}
        role="article"
        aria-labelledby={cardId}
        onClick={() => setIsModalOpen(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle id={cardId} className="text-sm font-medium text-gray-400">
            {title}
            {currentStatus && (
              <span className="sr-only"> - Stato: {currentStatus.label}</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span aria-hidden="true">{icon}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white" aria-label={`Valore: ${value}`}>
            {value}
          </div>
          {comparison && (
            <p className={cn("text-xs mt-1 flex items-center", comparison.color)}>
              {getComparisonIcon()}
              <span>
                {comparison.change} vs periodo precedente
                <span className="sr-only"> ({getComparisonLabel()})</span>
              </span>
            </p>
          )}
          {sparklineData && (
            <div className="mt-2" aria-hidden="true">
              <Sparkline data={sparklineData} dataKey="value" strokeColor="#22d3ee" />
            </div>
          )}
          <p className="text-[10px] text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Clicca per dettagli
          </p>
        </CardContent>
      </Card>

      <KpiDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        value={value}
        comparison={comparison}
        breakdown={mockBreakdown}
        trend={mockTrend}
      />
    </>
  );
}
