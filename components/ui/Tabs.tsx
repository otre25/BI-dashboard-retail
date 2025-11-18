import React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
  children: React.ReactNode;
  label?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, label = 'Schede' }) => (
  <div className="border-b border-gray-700">
    <nav className="-mb-px flex space-x-2 sm:space-x-6" aria-label={label} role="tablist">
      {children}
    </nav>
  </div>
);

interface TabProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  id?: string;
  controls?: string;
}

export const Tab: React.FC<TabProps> = ({ children, isActive, onClick, id, controls }) => (
  <button
    role="tab"
    id={id}
    aria-selected={isActive}
    aria-controls={controls}
    tabIndex={isActive ? 0 : -1}
    onClick={onClick}
    className={cn(
      'whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
      'min-h-[44px] min-w-[44px]', // Touch target size
      isActive
        ? 'border-cyan-500 text-cyan-400'
        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
    )}
  >
    {children}
  </button>
);