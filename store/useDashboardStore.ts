import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subDays } from 'date-fns';
import { CanaleEnum } from '../types';

type DashboardState = {
  dateRange: {
    from: Date;
    to: Date;
  };
  selectedStoreIds: 'all' | number[];
  selectedChannel: 'all' | CanaleEnum;
  isComparisonEnabled: boolean;
  kpiOrder: string[];
  chartOrder: string[];
  expandedCharts: Set<string>;
  setDateRange: (from: Date, to: Date) => void;
  setSelectedStoreIds: (ids: 'all' | number[]) => void;
  setSelectedChannel: (channel: 'all' | CanaleEnum) => void;
  setIsComparisonEnabled: (enabled: boolean) => void;
  setKpiOrder: (order: string[]) => void;
  setChartOrder: (order: string[]) => void;
  toggleChartExpanded: (chartId: string) => void;
};

const defaultTo = new Date();
const defaultFrom = subDays(defaultTo, 29);

const defaultKpiOrder = ['spesaAdv', 'mer', 'cac', 'conversionRate', 'fatturato', 'profitabilita'];
const defaultChartOrder = ['trendChart', 'roasChart', 'storeMap', 'funnel'];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      dateRange: { from: defaultFrom, to: defaultTo },
      selectedStoreIds: 'all',
      selectedChannel: 'all',
      isComparisonEnabled: false,
      kpiOrder: defaultKpiOrder,
      chartOrder: defaultChartOrder,
      expandedCharts: new Set(),
      setDateRange: (from, to) => set({ dateRange: { from, to } }),
      setSelectedStoreIds: (ids) => set({ selectedStoreIds: ids }),
      setSelectedChannel: (channel) => set({ selectedChannel: channel }),
      setIsComparisonEnabled: (enabled) => set({ isComparisonEnabled: enabled }),
      setKpiOrder: (order) => set({ kpiOrder: order }),
      setChartOrder: (order) => set({ chartOrder: order }),
      toggleChartExpanded: (chartId) => set((state) => {
        const newExpanded = new Set(state.expandedCharts);
        if (newExpanded.has(chartId)) {
          newExpanded.delete(chartId);
        } else {
          newExpanded.add(chartId);
        }
        return { expandedCharts: newExpanded };
      }),
    }),
    {
      name: 'dashboard-preferences',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              dateRange: {
                from: new Date(state.dateRange.from),
                to: new Date(state.dateRange.to),
              },
              expandedCharts: new Set(state.expandedCharts || []),
            },
          };
        },
        setItem: (name, value) => {
          const str = JSON.stringify({
            state: {
              ...value.state,
              expandedCharts: Array.from(value.state.expandedCharts),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
