import React, { useState } from 'react';
import { Tabs, Tab } from '../ui/Tabs';
import { ReportGenerator } from './ReportGenerator';
import { AlertCenter } from './AlertCenter';

type ReportTab = 'generator' | 'alerts';

export function ReportsSection() {
  const [activeTab, setActiveTab] = useState<ReportTab>('generator');

  return (
    <div className="mt-6 space-y-6">
      <Tabs>
        <Tab isActive={activeTab === 'generator'} onClick={() => setActiveTab('generator')}>Report Generator</Tab>
        <Tab isActive={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>Alert Center</Tab>
      </Tabs>
      
      <div className="mt-4">
        {activeTab === 'generator' && <ReportGenerator />}
        {activeTab === 'alerts' && <AlertCenter />}
      </div>
    </div>
  );
}