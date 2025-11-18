import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-900/90',
    borderColor: 'border-green-500',
    iconColor: 'text-green-400',
    titleColor: 'text-green-300',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-900/90',
    borderColor: 'border-red-500',
    iconColor: 'text-red-400',
    titleColor: 'text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-900/90',
    borderColor: 'border-yellow-500',
    iconColor: 'text-yellow-400',
    titleColor: 'text-yellow-300',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-900/90',
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-300',
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm min-w-[320px] max-w-md',
        'transform transition-all duration-300 ease-in-out',
        'animate-slide-in-right',
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} aria-hidden="true" />
      <div className="flex-grow min-w-0">
        <p className={cn('font-semibold text-sm', config.titleColor)}>{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-gray-300 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        ref={closeButtonRef}
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={`Chiudi notifica: ${toast.title}`}
      >
        <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        aria-label="Notifiche"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
