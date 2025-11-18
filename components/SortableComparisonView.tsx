import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ComparisonView } from './ComparisonView';
import { GripVertical } from 'lucide-react';

interface ComparisonData {
  current: {
    value: string;
    label: string;
  };
  previous: {
    value: string;
    label: string;
  };
  change: {
    percentage: string;
    isPositive: boolean;
    isNeutral: boolean;
  };
}

interface SortableComparisonViewProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  data: ComparisonData;
  statusColor?: 'green' | 'yellow' | 'red';
}

export function SortableComparisonView(props: SortableComparisonViewProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover/sortable:opacity-100 transition-opacity"
        aria-label="Trascina per riordinare"
      >
        <div className="bg-gray-700 rounded p-1 shadow-lg">
          <GripVertical className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      <ComparisonView
        title={props.title}
        icon={props.icon}
        data={props.data}
        statusColor={props.statusColor}
      />
    </div>
  );
}
