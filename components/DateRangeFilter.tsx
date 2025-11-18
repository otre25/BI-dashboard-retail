import React, { useState, useRef, useEffect } from 'react';
import { subDays, differenceInDays } from 'date-fns';
import { useDashboardStore } from '../store/useDashboardStore';
import { cn } from '../lib/utils';
import { negozi } from '../lib/mockData';
import { CanaleEnum } from '../types';
import { ChevronDown, X, GitCompare } from 'lucide-react';

const ranges = [
  { label: 'Oggi', days: 0 },
  { label: '7 giorni', days: 6 },
  { label: '30 giorni', days: 29 },
  { label: '90 giorni', days: 89 },
  { label: 'Anno', days: 364 },
];

const channels = [
    { label: 'Tutti i Canali', value: 'all' },
    { label: 'Meta', value: CanaleEnum.Meta },
    { label: 'Google', value: CanaleEnum.Google },
    { label: 'Programmatic', value: CanaleEnum.Programmatic },
];

function useOutsideAlerter(ref: React.RefObject<any>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

function MultiSelectStore() {
    const { selectedStoreIds, setSelectedStoreIds } = useDashboardStore();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const listboxId = 'store-selector-listbox';
    useOutsideAlerter(wrapperRef, () => setIsOpen(false));

    const handleSelect = (storeId: number) => {
        if (selectedStoreIds === 'all') {
            setSelectedStoreIds([storeId]);
        } else {
            const newIds = selectedStoreIds.includes(storeId)
                ? selectedStoreIds.filter(id => id !== storeId)
                : [...selectedStoreIds, storeId];
            setSelectedStoreIds(newIds.length === 0 ? 'all' : newIds);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const label = selectedStoreIds === 'all'
        ? 'Tutti i Negozi'
        : selectedStoreIds.length === 1
        ? negozi.find(n => n.id === selectedStoreIds[0])?.nome
        : `${selectedStoreIds.length} Negozi Selezionati`;

    const selectedCount = selectedStoreIds === 'all' ? negozi.length : selectedStoreIds.length;

    return (
        <div className="relative" ref={wrapperRef} onKeyDown={handleKeyDown}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-label={`Seleziona negozi: ${label}`}
                className="flex items-center justify-between w-full sm:w-56 text-left bg-gray-700 px-4 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
            >
                <span className="truncate">{label}</span>
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {isOpen && (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-label="Lista negozi"
                    aria-multiselectable="true"
                    className="absolute z-10 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-80 overflow-y-auto animate-fade-in"
                >
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => { setSelectedStoreIds('all'); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                        >
                            Tutti i Negozi
                        </button>
                        <button
                            onClick={() => setSelectedStoreIds(negozi.map(n => n.id))}
                            className="w-full text-left px-4 py-2.5 text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                        >
                            Seleziona Tutti
                        </button>
                    </div>
                    <div className="border-t border-gray-700" />
                    <ul className="p-2 space-y-1">
                        {negozi.map(store => (
                            <li key={store.id} role="option" aria-selected={selectedStoreIds !== 'all' && selectedStoreIds.includes(store.id)}>
                                <label className="flex items-center space-x-3 px-4 py-2.5 rounded-md hover:bg-gray-700 cursor-pointer min-h-[44px]">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800"
                                        checked={selectedStoreIds !== 'all' && selectedStoreIds.includes(store.id)}
                                        onChange={() => handleSelect(store.id)}
                                        aria-label={`Seleziona ${store.nome}`}
                                    />
                                    <span className="text-sm">{store.nome}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className="p-2 border-t border-gray-700 text-xs text-gray-500">
                        {selectedCount} di {negozi.length} selezionati
                    </div>
                </div>
            )}
        </div>
    );
}

export function FilterPanel() {
  const { dateRange, setDateRange, selectedChannel, setSelectedChannel, selectedStoreIds, isComparisonEnabled, setIsComparisonEnabled } = useDashboardStore();
  const today = new Date();
  const selectedDays = differenceInDays(dateRange.to, dateRange.from);

  return (
    <section aria-label="Filtri dashboard" className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
      {/* Date Range Buttons */}
      <fieldset>
        <legend className="sr-only">Seleziona periodo temporale</legend>
        <div
          className="flex items-center flex-wrap gap-2 bg-gray-800/60 p-1.5 rounded-lg"
          role="radiogroup"
          aria-label="Intervallo date"
        >
          {ranges.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => setDateRange(subDays(today, days), today)}
              role="radio"
              aria-checked={selectedDays === days}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                'min-h-[44px]',
                selectedDays === days
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Other Filters */}
      <div className="flex items-center flex-wrap gap-3">
        <MultiSelectStore />

        <div className="relative">
            <label htmlFor="channel-select" className="sr-only">Seleziona canale pubblicitario</label>
            <select
                id="channel-select"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value as 'all' | CanaleEnum)}
                className="appearance-none w-full sm:w-auto bg-gray-700 px-4 py-2.5 pr-10 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
            >
                {channels.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
        </div>

        <button
          onClick={() => setIsComparisonEnabled(!isComparisonEnabled)}
          aria-pressed={isComparisonEnabled}
          aria-label={isComparisonEnabled ? 'Disattiva confronto periodi' : 'Attiva confronto periodi'}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]',
            isComparisonEnabled
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20 hover:bg-cyan-700'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          <GitCompare className="w-4 h-4" aria-hidden="true" />
          <span>Confronta Periodi</span>
        </button>
      </div>
    </section>
  );
}