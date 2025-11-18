import React from 'react';
import { BarChart3, Megaphone, TrendingUp, FileText, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { type View } from '../App';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

export function Header({ currentView, setCurrentView }: HeaderProps) {
  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: BarChart3 },
    { id: 'advertising' as View, label: 'Advertising', icon: Megaphone },
    { id: 'sales' as View, label: 'Sales', icon: TrendingUp },
    { id: 'reports' as View, label: 'Reports & Alerts', icon: FileText },
    { id: 'settings' as View, label: 'Impostazioni API', icon: Settings },
  ];

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-700 gap-4">
      <div className="flex items-center space-x-3">
        <BarChart3 className="w-8 h-8 text-cyan-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white">Executive BI Dashboard</h1>
      </div>

      <nav aria-label="Navigazione principale">
        <div className="flex items-center bg-gray-800/60 p-1.5 rounded-lg flex-wrap gap-1" role="tablist">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${item.id}-panel`}
                id={`${item.id}-tab`}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                  'min-h-[44px]', // Touch target size
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700'
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}