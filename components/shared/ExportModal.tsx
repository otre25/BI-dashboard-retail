import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { DataTable, ColumnDef } from '../ui/DataTable';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../ui/Toast';

interface ExportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  data: T[];
  columns: ColumnDef<T>[];
  filename: string;
}

export function ExportModal<T>({ isOpen, onClose, data, columns, filename }: ExportModalProps<T>) {
  const allColumnKeys = useMemo(() => columns.map(c => c.accessorKey as string).filter(Boolean), [columns]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(allColumnKeys);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { modalRef } = useModal({ isOpen, onClose, initialFocusRef: closeButtonRef });
  const { showToast } = useToast();

  useEffect(() => {
      if (isOpen) {
          setSelectedKeys(allColumnKeys);
      }
  }, [isOpen, allColumnKeys]);

  const handleToggleKey = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const previewData = useMemo(() => data.slice(0, 5).map(row => {
      const newRow: Partial<T> = {};
      selectedKeys.forEach(key => {
          newRow[key as keyof T] = row[key as keyof T];
      });
      return newRow as T;
  }), [data, selectedKeys]);

  const previewColumns = useMemo(() => columns.filter(c => c.accessorKey && selectedKeys.includes(c.accessorKey as string)), [columns, selectedKeys]);

  const handleExport = () => {
    try {
      const exportData = data.map(row => {
        const newRow: { [key: string]: any } = {};
        selectedKeys.forEach(key => {
          newRow[key] = row[key as keyof T];
        });
        return newRow;
      });

      const headers = selectedKeys;
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => {
            let value = row[header];
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast({
        type: 'success',
        title: 'Esportazione completata',
        message: `${data.length} righe esportate in ${filename}`,
      });

      onClose();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Errore esportazione',
        message: 'Si è verificato un errore durante l\'esportazione dei dati.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        aria-describedby="export-modal-desc"
        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 id="export-modal-title" className="text-xl font-bold text-white">Esportazione Avanzata</h2>
            <p id="export-modal-desc" className="text-sm text-gray-400 mt-1">
              Seleziona le colonne da includere nel file CSV
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            aria-label="Chiudi finestra esportazione"
          >
            <X className="w-6 h-6 text-gray-300" aria-hidden="true" />
          </button>
        </header>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <fieldset className="md:col-span-1">
                <legend className="font-semibold text-white mb-2">Seleziona Colonne</legend>
                <div
                  className="space-y-2 max-h-80 overflow-y-auto bg-gray-900/50 p-3 rounded-lg"
                  role="group"
                  aria-label="Lista colonne disponibili"
                >
                    {columns.map(col => col.accessorKey && (
                        <label key={String(col.accessorKey)} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-800/50 p-1 rounded">
                            <input
                                type="checkbox"
                                className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800"
                                checked={selectedKeys.includes(col.accessorKey as string)}
                                onChange={() => handleToggleKey(col.accessorKey as string)}
                                aria-describedby={`col-desc-${String(col.accessorKey)}`}
                            />
                            <span id={`col-desc-${String(col.accessorKey)}`} className="text-sm text-gray-300">{col.header}</span>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2" aria-live="polite">
                  {selectedKeys.length} di {allColumnKeys.length} colonne selezionate
                </p>
            </fieldset>
            <div className="md:col-span-2">
                <h3 className="font-semibold text-white mb-2">Anteprima Dati (Prime 5 righe)</h3>
                <div aria-label="Anteprima dati selezionati">
                  <DataTable columns={previewColumns} data={previewData} />
                </div>
            </div>
        </div>
        <footer className="p-4 border-t border-gray-700 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
                Annulla
            </button>
            <button
                onClick={handleExport}
                disabled={selectedKeys.length === 0}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-describedby="export-button-status"
            >
                <Download className="w-5 h-5" aria-hidden="true" />
                Esporta {selectedKeys.length} Colonne
            </button>
            <span id="export-button-status" className="sr-only">
              {selectedKeys.length === 0 ? 'Seleziona almeno una colonna per abilitare l\'esportazione' : `Pronto per esportare ${selectedKeys.length} colonne`}
            </span>
        </footer>
      </div>
    </div>
  );
}