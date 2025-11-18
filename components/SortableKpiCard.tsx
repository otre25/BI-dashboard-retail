import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KpiCard } from './KpiCard';
import { GripVertical } from 'lucide-react';

interface SortableKpiCardProps {
  id: string;
  title: string;
  value: string;
  icon: React.ReactNode;
  comparison?: {
    change: string;
    color: 'text-green-400' | 'text-red-400' | 'text-gray-400';
  };
  sparklineData?: { date: string; value: number }[];
  statusColor?: 'green' | 'yellow' | 'red';
}

export function SortableKpiCard(props: SortableKpiCardProps) {
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

      <KpiCard
        title={props.title}
        value={props.value}
        icon={props.icon}
        comparison={props.comparison}
        sparklineData={props.sparklineData}
        statusColor={props.statusColor}
      />
    </div>
  );
}
