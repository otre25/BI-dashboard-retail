import React from 'react';
import { KpiCard } from './KpiCard';
import { ComparisonView } from './ComparisonView';
import { DollarSign, TrendingUp, Users, Target, ShoppingCart, Activity } from 'lucide-react';
import { SkeletonCard } from './ui/SkeletonCard';
import { useDashboardStore } from '../store/useDashboardStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableKpiCard } from './SortableKpiCard';
import { SortableComparisonView } from './SortableComparisonView';

interface KpiGridProps {
  kpiData: any;
  isLoading: boolean;
}

export function KpiGrid({ kpiData, isLoading }: KpiGridProps) {
  const { isComparisonEnabled, kpiOrder, setKpiOrder } = useDashboardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = kpiOrder.indexOf(active.id as string);
      const newIndex = kpiOrder.indexOf(over.id as string);
      const newOrder = arrayMove(kpiOrder, oldIndex, newIndex);
      setKpiOrder(newOrder);
    }
  };

  if (isLoading) {
    return (
      <section aria-label="Indicatori chiave di performance" aria-busy="true">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <p className="sr-only">Caricamento KPI in corso...</p>
      </section>
    );
  }

  // Mock comparison data (in a real app, this would come from the API)
  const generateComparisonData = (currentValue: number, comparisonData: any) => {
    const previousValue = currentValue * 0.85; // Mock: -15% decrease
    const changePercentage = ((currentValue - previousValue) / previousValue * 100).toFixed(1);
    const isPositive = currentValue > previousValue;
    const isNeutral = Math.abs(currentValue - previousValue) < 0.01;

    return {
      current: {
        value: `€${currentValue.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`,
        label: 'Periodo Corrente'
      },
      previous: {
        value: `€${previousValue.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`,
        label: 'Periodo Precedente'
      },
      change: {
        percentage: `${isPositive ? '+' : ''}${changePercentage}%`,
        isPositive,
        isNeutral
      }
    };
  };

  // KPI configurations
  const kpiConfigs: Record<string, any> = {
    spesaAdv: {
      title: 'Investimento ADV',
      value: `€${kpiData.spesaAdv.value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`,
      icon: <DollarSign className="w-6 h-6 text-red-400" />,
      comparison: kpiData.spesaAdv.comparison,
      comparisonData: generateComparisonData(kpiData.spesaAdv.value, kpiData.spesaAdv.comparison),
    },
    mer: {
      title: 'MER',
      value: `${kpiData.mer.value.toFixed(1)}x`,
      icon: <TrendingUp className="w-6 h-6 text-green-400" />,
      statusColor: kpiData.mer.status,
      comparison: kpiData.mer.comparison,
      comparisonData: {
        current: { value: `${kpiData.mer.value.toFixed(1)}x`, label: 'Periodo Corrente' },
        previous: { value: `${(kpiData.mer.value * 0.9).toFixed(1)}x`, label: 'Periodo Precedente' },
        change: { percentage: '+11.1%', isPositive: true, isNeutral: false }
      },
    },
    cac: {
      title: 'CAC Medio',
      value: `€${kpiData.cac.value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`,
      icon: <Target className="w-6 h-6 text-yellow-400" />,
      comparison: kpiData.cac.comparison,
      comparisonData: generateComparisonData(kpiData.cac.value, kpiData.cac.comparison),
    },
    conversionRate: {
      title: 'Conversion Rate',
      value: `${(kpiData.conversionRate.value * 100).toFixed(1)}%`,
      icon: <Users className="w-6 h-6 text-purple-400" />,
      comparison: kpiData.conversionRate.comparison,
      comparisonData: {
        current: { value: `${(kpiData.conversionRate.value * 100).toFixed(1)}%`, label: 'Periodo Corrente' },
        previous: { value: `${(kpiData.conversionRate.value * 100 * 0.88).toFixed(1)}%`, label: 'Periodo Precedente' },
        change: { percentage: '+13.6%', isPositive: true, isNeutral: false }
      },
    },
    fatturato: {
      title: 'Fatturato Totale',
      value: `€${kpiData.fatturato.value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`,
      icon: <ShoppingCart className="w-6 h-6 text-cyan-400" />,
      sparklineData: kpiData.fatturato.sparklineData,
      comparisonData: generateComparisonData(kpiData.fatturato.value, null),
    },
    profitabilita: {
      title: 'Redditività / m²',
      value: `€${kpiData.profitabilita.value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`,
      icon: <Activity className="w-6 h-6 text-blue-400" />,
      comparison: kpiData.profitabilita.comparison,
      comparisonData: generateComparisonData(kpiData.profitabilita.value, kpiData.profitabilita.comparison),
    },
  };

  if (isComparisonEnabled) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <section aria-label="Confronto indicatori chiave di performance">
          <h2 className="sr-only">Confronto metriche principali</h2>
          <SortableContext items={kpiOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {kpiOrder.map((kpiId) => {
                const config = kpiConfigs[kpiId];
                return (
                  <SortableComparisonView
                    key={kpiId}
                    id={kpiId}
                    title={config.title}
                    icon={config.icon}
                    data={config.comparisonData}
                    statusColor={config.statusColor}
                  />
                );
              })}
            </div>
          </SortableContext>
        </section>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <section aria-label="Indicatori chiave di performance">
        <h2 className="sr-only">Metriche principali</h2>
        <SortableContext items={kpiOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
            {kpiOrder.map((kpiId) => {
              const config = kpiConfigs[kpiId];
              return (
                <SortableKpiCard
                  key={kpiId}
                  id={kpiId}
                  title={config.title}
                  value={config.value}
                  icon={config.icon}
                  comparison={config.comparison}
                  sparklineData={config.sparklineData}
                  statusColor={config.statusColor}
                />
              );
            })}
          </div>
        </SortableContext>
      </section>
    </DndContext>
  );
}
