import React, { useState } from 'react';
import { Header } from './components/Header';
import { FilterPanel } from './components/DateRangeFilter';
import { KpiGrid } from './components/KpiGrid';
import { TrendChart } from './components/SalesOverTimeChart';
import { ChannelROASChart } from './components/RoasByChannelChart';
import { StoreMapChart } from './components/StoreMapChart';
import { FunnelChart } from './components/LeadFunnel';
import { useDashboardStore } from './store/useDashboardStore';
import { useKPIData } from './hooks/useAnalyticsData';
import { AdvertisingSection } from './components/advertising/AdvertisingSection';
import { SalesSection } from './components/sales/SalesSection';
import { ReportsSection } from './components/reports/ReportsSection';
import { QuickActions } from './components/QuickActions';
import { useTheme } from './hooks/useTheme';
import { cn } from './lib/utils';
import { SortableChart } from './components/SortableChart';
import { useUrlState } from './hooks/useUrlState';
import { ApiSettingsPanel } from './components/settings/ApiSettingsPanel';
import { DataSourcePanel } from './components/settings/DataSourcePanel';
import { LoginForm } from './components/auth/LoginForm';
import { useAuth } from './hooks/useAuth';
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

export type View = 'dashboard' | 'advertising' | 'sales' | 'reports' | 'settings' | 'datasources';

// Authenticated Dashboard Component
function AuthenticatedDashboard() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [lastUpdate] = useState(new Date());
  const { isDark, toggleTheme } = useTheme();
  const { generateShareUrl } = useUrlState();
  const { dateRange, selectedStoreIds, selectedChannel, chartOrder, setChartOrder, expandedCharts } = useDashboardStore();
  const { data, isLoading: isLoadingData } = useKPIData(dateRange.from, dateRange.to, selectedStoreIds, selectedChannel);

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

  const handleChartDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chartOrder.indexOf(active.id as string);
      const newIndex = chartOrder.indexOf(over.id as string);
      const newOrder = arrayMove(chartOrder, oldIndex, newIndex);
      setChartOrder(newOrder);
    }
  };

  const chartComponents: Record<string, React.ReactNode> = {
    trendChart: <TrendChart data={data.trendData} isLoading={isLoadingData} />,
    roasChart: <ChannelROASChart data={data.roasByChannel} isLoading={isLoadingData} />,
    storeMap: <StoreMapChart data={data.storesHeatmap} isLoading={isLoadingData} />,
    funnel: <FunnelChart data={data.funnelData} isLoading={isLoadingData} />,
  };

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return (
          <>
            <div className="my-6">
              <FilterPanel />
            </div>
            <main className="space-y-6">
              <KpiGrid kpiData={data.kpis} isLoading={isLoadingData} />
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleChartDragEnd}
              >
                <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {chartOrder.map((chartId) => (
                      <SortableChart
                        key={chartId}
                        id={chartId}
                        isExpanded={expandedCharts.has(chartId)}
                      >
                        {chartComponents[chartId]}
                      </SortableChart>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </main>
          </>
        );
      case 'advertising':
        return <AdvertisingSection />;
      case 'sales':
        return <SalesSection />;
      case 'reports':
        return <ReportsSection />;
      case 'settings':
        return <ApiSettingsPanel />;
      case 'datasources':
        return <DataSourcePanel />;
      default:
        return null;
    }
  }

  return (
    <div className={cn(
      "min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300",
      isDark ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"
    )}>
      <a href="#main-content" className="skip-link">
        Salta al contenuto principale
      </a>
      <div className="max-w-screen-2xl mx-auto">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <div className="mt-4">
          <QuickActions
            onToggleTheme={toggleTheme}
            isDarkTheme={isDark}
            lastUpdate={lastUpdate}
            shareUrl={generateShareUrl()}
          />
        </div>
        <div id="main-content" tabIndex={-1}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}

// Main App Component with Auth
function App() {
  const { isAuthenticated, isLoading, login } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} onSwitchToRegister={() => {}} />;
  }

  // Show authenticated dashboard
  return <AuthenticatedDashboard />;
}

export default App;