import React, { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { cn } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const exportItems = [
  { id: 'kpis', label: 'KPI Cards', icon: <FileText className="w-4 h-4" /> },
  { id: 'trendChart', label: 'Andamento Vendite', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'roasChart', label: 'ROAS per Canale', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'storeMap', label: 'Mappa Negozi', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'funnel', label: 'Funnel Lead', icon: <ImageIcon className="w-4 h-4" /> },
];

const exportFormats = [
  { id: 'pdf', label: 'PDF', icon: <FileText className="w-5 h-5" /> },
  { id: 'png', label: 'PNG', icon: <ImageIcon className="w-5 h-5" /> },
  { id: 'xlsx', label: 'Excel', icon: <FileSpreadsheet className="w-5 h-5" /> },
];

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { modalRef } = useModal(isOpen, onClose);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(exportItems.map(item => item.id)));
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(exportItems.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting:', {
      items: Array.from(selectedItems),
      format: selectedFormat,
    });
    alert(`Esportazione in formato ${selectedFormat.toUpperCase()} avviata!\nElementi: ${selectedItems.size}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 id="export-modal-title" className="text-xl font-bold text-white">
              Esporta Report
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Seleziona gli elementi da includere nel report
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            aria-label="Chiudi modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Formato Export</h3>
            <div className="grid grid-cols-3 gap-3">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                    selectedFormat === format.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-gray-700 bg-gray-750 text-gray-400 hover:border-gray-600'
                  )}
                >
                  {format.icon}
                  <span className="text-sm font-medium">{format.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Items Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">Elementi da Esportare</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Seleziona Tutti
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Deseleziona Tutti
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {exportItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200',
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/5'
                        : 'border-gray-700 bg-gray-750 hover:border-gray-600'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id)}
                      className="w-5 h-5 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800"
                    />
                    <div className="text-gray-400">{item.icon}</div>
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="text-sm text-gray-400">
            {selectedItems.size} {selectedItems.size === 1 ? 'elemento selezionato' : 'elementi selezionati'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleExport}
              disabled={selectedItems.size === 0}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                selectedItems.size === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/20'
              )}
            >
              <Download className="w-4 h-4" />
              Esporta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
