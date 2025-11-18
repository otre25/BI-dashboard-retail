import React, { useState } from 'react';
import { subDays } from 'date-fns';
import { Tabs, Tab } from '../ui/Tabs';
import { useSalesData } from '../../hooks/useSalesData';
import { StoresPerformanceTab } from './tabs/StoresPerformanceTab';
import { SalesRepRankingTab } from './tabs/SalesRepRankingTab';
import { ProductAnalysisTab } from './tabs/ProductAnalysisTab';
import { LeadSourceTab } from './tabs/LeadSourceTab';

type SalesTab = 'stores' | 'reps' | 'products' | 'leads';

export function SalesSection() {
  const [activeTab, setActiveTab] = useState<SalesTab>('stores');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data, isLoading } = useSalesData(dateRange.from, dateRange.to);

  const renderContent = () => {
    switch (activeTab) {
      case 'stores':
        return <StoresPerformanceTab data={data.stores} isLoading={isLoading} />;
      case 'reps':
        return <SalesRepRankingTab data={data.salesReps} isLoading={isLoading} />;
      case 'products':
        return <ProductAnalysisTab data={data.products} isLoading={isLoading} />;
      case 'leads':
        return <LeadSourceTab data={data.leadSources} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  // Note: A global filter panel would go here. For simplicity, we manage date range internally.
  // A shared filter panel component could be built and placed here, similar to the advertising section.

  return (
    <div className="mt-6 space-y-6">
      <Tabs>
        <Tab isActive={activeTab === 'stores'} onClick={() => setActiveTab('stores')}>Negozi</Tab>
        <Tab isActive={activeTab === 'reps'} onClick={() => setActiveTab('reps')}>Venditori</Tab>
        <Tab isActive={activeTab === 'products'} onClick={() => setActiveTab('products')}>Prodotti</Tab>
        <Tab isActive={activeTab === 'leads'} onClick={() => setActiveTab('leads')}>Lead Source</Tab>
      </Tabs>
      
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}