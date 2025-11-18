import React, { useState } from 'react';
import { subDays } from 'date-fns';
import { Tabs, Tab } from '../ui/Tabs';
import { AdvertisingFilterPanel } from './AdvertisingFilterPanel';
import { ChannelOverviewTab } from './tabs/ChannelOverviewTab';
import { MetaAdsTab } from './tabs/MetaAdsTab';
import { GoogleAdsTab } from './tabs/GoogleAdsTab';
import { ProgrammaticTab } from './tabs/ProgrammaticTab';
import { useAdvertisingData } from '../../hooks/useAdvertisingData';

type AdvertisingTab = 'overview' | 'meta' | 'google' | 'programmatic';

export function AdvertisingSection() {
  const [activeTab, setActiveTab] = useState<AdvertisingTab>('overview');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data, isLoading } = useAdvertisingData(dateRange.from, dateRange.to);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ChannelOverviewTab data={data.overview} isLoading={isLoading} />;
      case 'meta':
        return <MetaAdsTab data={data.meta} isLoading={isLoading} />;
      case 'google':
        return <GoogleAdsTab data={data.google} isLoading={isLoading} />;
      case 'programmatic':
        return <ProgrammaticTab data={data.programmatic} isLoading={isLoading} />;
      default:
        return null;
    }
  };
  
  const getExportData = () => {
    switch(activeTab) {
        case 'overview': return data.overview.tableData;
        case 'meta': return data.meta.campaigns;
        case 'google': return data.google.campaigns;
        case 'programmatic': return data.programmatic.publishers;
        default: return [];
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <AdvertisingFilterPanel 
        dateRange={dateRange} 
        setDateRange={setDateRange} 
        exportData={getExportData()}
        exportFilename={`advertising_${activeTab}_export.csv`}
      />
      
      <Tabs>
        <Tab isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</Tab>
        <Tab isActive={activeTab === 'meta'} onClick={() => setActiveTab('meta')}>Meta Ads</Tab>
        <Tab isActive={activeTab === 'google'} onClick={() => setActiveTab('google')}>Google Ads</Tab>
        <Tab isActive={activeTab === 'programmatic'} onClick={() => setActiveTab('programmatic')}>Programmatic</Tab>
      </Tabs>
      
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}