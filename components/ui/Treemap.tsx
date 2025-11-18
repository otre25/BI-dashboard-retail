import React from 'react';

interface TreemapProps {
  data: { name: string; size: number }[];
}

const COLORS = [
  'bg-cyan-800', 'bg-cyan-700', 'bg-cyan-600', 'bg-cyan-500', 'bg-cyan-400',
  'bg-teal-800', 'bg-teal-700', 'bg-teal-600', 'bg-teal-500', 'bg-teal-400',
];

// FIX: Define a dedicated interface for TreemapNode props to fix typing issue with the 'key' prop.
interface TreemapNodeProps {
  name: string;
  size: number;
  percentage: number;
  color: string;
}

// FIX: Refactor to React.FC to fix typing issue with the 'key' prop.
const TreemapNode: React.FC<TreemapNodeProps> = ({ name, size, percentage, color }) => {
  const showLabel = percentage > 2; // Only show label for larger blocks
  
  return (
    <div
      className={`relative group flex items-center justify-center p-1 text-white overflow-hidden ${color} hover:opacity-80 transition-opacity`}
      style={{ flexBasis: `${percentage}%` }}
    >
      {showLabel && (
        <div className="text-center">
            <p className="text-xs sm:text-sm font-bold truncate">{name}</p>
            <p className="text-xs opacity-80">{percentage.toFixed(1)}%</p>
        </div>
      )}
      <div className="absolute z-10 bottom-full mb-2 w-max p-2 text-xs text-left bg-gray-900 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <p className="font-bold text-white">{name}</p>
        <p>Fatturato: €{size.toLocaleString()}</p>
        <p>Quota: {percentage.toFixed(2)}%</p>
      </div>
    </div>
  );
};

export function Treemap({ data }: TreemapProps) {
  const totalSize = data.reduce((sum, item) => sum + item.size, 0);
  const sortedData = [...data].sort((a, b) => b.size - a.size);

  const renderRow = (rowData: typeof sortedData, totalRowSize: number, isHorizontal: boolean) => (
    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'}`} style={{ flexBasis: `${(totalRowSize / totalSize) * 100}%` }}>
      {rowData.map((item) => (
        <TreemapNode
          key={item.name}
          name={item.name}
          size={item.size}
          percentage={(item.size / totalRowSize) * 100}
          color={COLORS[sortedData.indexOf(item) % COLORS.length]}
        />
      ))}
    </div>
  );
  
  // Simple layout algorithm: split into rows
  const rows = [];
  let currentRow = [];
  let currentRowSize = 0;
  const targetRowRatio = 0.4; // Aim for rows to be ~40% of total size

  for (const item of sortedData) {
      currentRow.push(item);
      currentRowSize += item.size;
      if (currentRowSize >= totalSize * targetRowRatio || sortedData.indexOf(item) === sortedData.length -1) {
          rows.push({ items: currentRow, size: currentRowSize });
          currentRow = [];
          currentRowSize = 0;
      }
  }

  return (
    <div className="flex flex-col w-full h-full bg-gray-800 rounded-lg overflow-hidden">
      {rows.map((row, index) => renderRow(row.items, row.size, index % 2 === 0))}
    </div>
  );
}