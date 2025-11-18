import React from 'react';
import { subDays, differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { ExportButton } from './ExportButton';

const ranges = [
  { label: 'Oggi', days: 0 },
  { label: '7 giorni', days: 6 },
  { label: '30 giorni', days: 29 },
  { label: '90 giorni', days: 89 },
];

interface AdvertisingFilterPanelProps {
    dateRange: { from: Date; to: Date; };
    setDateRange: (range: { from: Date; to: Date; }) => void;
    exportData: any[];
    exportFilename: string;
}

export function AdvertisingFilterPanel({ dateRange, setDateRange, exportData, exportFilename }: AdvertisingFilterPanelProps) {
  const today = new Date();
  const selectedDays = differenceInDays(dateRange.to, dateRange.from);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
      <div className="flex items-center flex-wrap gap-2 bg-gray-800/60 p-1.5 rounded-lg">
        {ranges.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => setDateRange({ from: subDays(today, days), to: today })}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
              selectedDays === days
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>
      
      <ExportButton data={exportData} filename={exportFilename} />
    </div>
  );
}