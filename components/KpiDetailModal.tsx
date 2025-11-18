import React from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Store, Target } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { cn } from '../lib/utils';

interface KpiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  comparison?: {
    change: string;
    color: string;
  };
  breakdown?: {
    label: string;
    value: string;
    percentage?: number;
  }[];
  trend?: {
    period: string;
    value: number;
  }[];
}

export function KpiDetailModal({
  isOpen,
  onClose,
  title,
  value,
  comparison,
  breakdown = [],
  trend = []
}: KpiDetailModalProps) {
  const { modalRef } = useModal({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kpi-detail-title"
        className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="kpi-detail-title" className="text-lg font-bold text-white">
            {title} - Dettaglio
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main value */}
          <div className="text-center">
            <p className="text-4xl font-bold text-white mb-2">{value}</p>
            {comparison && (
              <p className={cn("text-sm flex items-center justify-center gap-1", comparison.color)}>
                {comparison.color.includes('green') ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{comparison.change} vs periodo precedente</span>
              </p>
            )}
          </div>

          {/* Breakdown by store or channel */}
          {breakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-cyan-400" />
                Breakdown per Negozio
              </h3>
              <div className="space-y-2">
                {breakdown.map((item, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                    {item.percentage !== undefined && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend over time */}
          {trend.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Trend Storico
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {trend.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-500 mb-1">{item.period}</p>
                      <p className="text-xs font-bold text-white">
                        {typeof item.value === 'number' && item.value > 1000
                          ? `€${(item.value / 1000).toFixed(0)}k`
                          : item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target comparison */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              Confronto con Target
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Target Mensile</p>
                <p className="text-lg font-bold text-white">€250.000</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Raggiungimento</p>
                <p className="text-lg font-bold text-green-400">112%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Delta</p>
                <p className="text-lg font-bold text-green-400">+€30.000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
