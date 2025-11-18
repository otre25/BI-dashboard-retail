import React from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const { showToast } = useToast();

  const handleExport = () => {
    if (data.length === 0) {
      showToast({
        type: 'warning',
        title: 'Nessun dato',
        message: 'Non ci sono dati da esportare.',
      });
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            let value = row[header];
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.href) {
        URL.revokeObjectURL(link.href);
      }
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
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Errore esportazione',
        message: 'Si è verificato un errore durante l\'esportazione.',
      });
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-gray-700 px-4 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
      aria-label={`Esporta dati in formato CSV: ${filename}`}
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      Esporta CSV
    </button>
  );
}