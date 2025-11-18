import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, Minimize2, Maximize } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { cn } from '../lib/utils';

interface SortableChartProps {
  id: string;
  children: React.ReactNode;
  isExpanded: boolean;
}

export function SortableChart({ id, children, isExpanded }: SortableChartProps) {
  const { toggleChartExpanded } = useDashboardStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/sortable-chart",
        isExpanded && "xl:col-span-2"
      )}
    >
      {/* Control Buttons */}
      <div className="absolute -left-2 top-4 z-10 flex flex-col gap-2 opacity-0 group-hover/sortable-chart:opacity-100 transition-opacity">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
          aria-label="Trascina per riordinare"
        >
          <div className="bg-gray-700 rounded p-1 shadow-lg hover:bg-gray-600 transition-colors">
            <GripVertical className="w-4 h-4 text-gray-300" />
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => toggleChartExpanded(id)}
          className="bg-gray-700 rounded p-1 shadow-lg hover:bg-gray-600 transition-colors"
          aria-label={isExpanded ? "Riduci grafico" : "Espandi grafico"}
          aria-pressed={isExpanded}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-gray-300" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-300" />
          )}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="bg-gray-700 rounded p-1 shadow-lg hover:bg-gray-600 transition-colors"
          aria-label="Vista fullscreen"
        >
          <Maximize className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {children}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="w-full h-full max-w-7xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute -top-12 right-0 text-white hover:text-cyan-400 transition-colors flex items-center gap-2 text-sm"
              aria-label="Chiudi fullscreen"
            >
              <span>Chiudi</span>
              <Minimize2 className="w-5 h-5" />
            </button>
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
