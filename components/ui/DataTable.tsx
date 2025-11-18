import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CellContext<T> {
  row: { original: T };
  getValue: <V = any>() => V;
}

export interface ColumnDef<T> {
  accessorKey?: keyof T;
  header: string;
  cell?: (info: CellContext<T>) => React.ReactNode;
  id?: string;
  sortable?: boolean;
}

type SortDirection = 'asc' | 'desc';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  caption?: string;
}

export function DataTable<T>({ columns, data, caption }: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.accessorKey) {
      return;
    }
    if (sortColumn === column.accessorKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.accessorKey);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;

      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const getSortIcon = (col: ColumnDef<T>) => {
    if (!col.accessorKey) return null;

    const isSorted = sortColumn === col.accessorKey;

    if (isSorted) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="w-4 h-4 text-cyan-400" aria-hidden="true" />
      ) : (
        <ArrowDown className="w-4 h-4 text-cyan-400" aria-hidden="true" />
      );
    }

    return <ArrowUpDown className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />;
  };

  const getSortLabel = (col: ColumnDef<T>) => {
    if (!col.accessorKey) return '';

    const isSorted = sortColumn === col.accessorKey;
    if (isSorted) {
      return sortDirection === 'asc'
        ? `Ordinato per ${col.header} in ordine crescente. Clicca per ordinare in ordine decrescente.`
        : `Ordinato per ${col.header} in ordine decrescente. Clicca per ordinare in ordine crescente.`;
    }
    return `Clicca per ordinare per ${col.header}`;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="min-w-full divide-y divide-gray-700" role="grid">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead className="bg-gray-800/50">
          <tr>
            {columns.map(col => {
              const isSortable = !!col.accessorKey;
              const isSorted = sortColumn === col.accessorKey;

              return (
                <th
                  key={String(col.accessorKey || col.id)}
                  scope="col"
                  className={cn(
                    'px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider',
                    isSortable && 'cursor-pointer hover:bg-gray-700/50 transition-colors group select-none'
                  )}
                  onClick={() => isSortable && handleSort(col)}
                  onKeyDown={(e) => {
                    if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(col);
                    }
                  }}
                  tabIndex={isSortable ? 0 : undefined}
                  aria-sort={
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  aria-label={isSortable ? getSortLabel(col) : undefined}
                  role={isSortable ? 'columnheader button' : 'columnheader'}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {isSortable && getSortIcon(col)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-gray-800/80 divide-y divide-gray-700">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-sm text-gray-400"
              >
                Nessun dato disponibile
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-700/50 transition-colors focus-within:bg-gray-700/30"
              >
                {columns.map(col => (
                  <td
                    key={String(col.accessorKey || col.id)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                  >
                    {col.cell
                      ? col.cell({ row: { original: row }, getValue: () => col.accessorKey ? row[col.accessorKey] : null })
                      : col.accessorKey ? String(row[col.accessorKey] ?? '') : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {data.length > 0 && (
        <div className="px-6 py-3 bg-gray-800/30 border-t border-gray-700 text-xs text-gray-500">
          {sortedData.length} {sortedData.length === 1 ? 'riga' : 'righe'} visualizzate
        </div>
      )}
    </div>
  );
}
