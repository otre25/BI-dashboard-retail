import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, label, showValue = false, size = 'sm' }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const sizeClasses = {
    sm: 'h-2.5',
    md: 'h-4',
    lg: 'h-6',
  };

  const barColor = clampedValue >= 100 ? 'bg-green-500' : clampedValue >= 75 ? 'bg-cyan-500' : clampedValue >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          {showValue && (
            <span className="text-sm font-medium text-gray-400">{clampedValue.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div
        className={cn('w-full bg-gray-700 rounded-full overflow-hidden', sizeClasses[size])}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progresso: ${clampedValue.toFixed(1)}%`}
      >
        <div
          className={cn(barColor, sizeClasses[size], 'rounded-full transition-all duration-300')}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}