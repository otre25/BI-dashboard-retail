import React from 'react';
import { AlertTriangle, Info, Bell, CheckCircle, XCircle } from 'lucide-react';
import { type Alert } from '../../hooks/useAlertsData';
import { cn } from '../../lib/utils';

interface AlertItemProps {
    alert: Alert;
    isResolved: boolean;
    onToggleResolve: () => void;
}

const priorityConfig = {
    critical: {
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        borderColor: 'border-red-500',
    },
    warning: {
        icon: <Bell className="w-5 h-5 text-yellow-400" />,
        borderColor: 'border-yellow-500',
    },
    info: {
        icon: <Info className="w-5 h-5 text-blue-400" />,
        borderColor: 'border-blue-500',
    },
};

// FIX: Refactor to a const with React.FC type to fix typing issue with the 'key' prop.
export const AlertItem: React.FC<AlertItemProps> = ({ alert, isResolved, onToggleResolve }) => {
    const config = priorityConfig[alert.priority];
    const alertId = `alert-${alert.id}`;
    const descId = `alert-desc-${alert.id}`;

    return (
        <article
            role="listitem"
            aria-labelledby={alertId}
            aria-describedby={descId}
            className={cn(
                'flex items-start gap-4 p-4 rounded-lg bg-gray-800/50 border-l-4',
                config.borderColor,
                isResolved && 'opacity-60'
            )}
        >
            <div className="flex-shrink-0 mt-1" aria-hidden="true">{config.icon}</div>
            <div className="flex-grow min-w-0">
                <h3 id={alertId} className="font-semibold text-white">{alert.title}</h3>
                <p id={descId} className="text-sm text-gray-400">{alert.description}</p>
                <time
                    dateTime={alert.timestamp}
                    className="text-xs text-gray-500 mt-1 block"
                >
                    {new Date(alert.timestamp).toLocaleString('it-IT')}
                </time>
            </div>
            <button
                onClick={onToggleResolve}
                className={cn(
                    'flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded',
                    'hover:bg-gray-700 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500',
                    'min-h-[44px] min-w-[44px]'
                )}
                aria-label={
                    isResolved
                        ? `Riattiva alert: ${alert.title}`
                        : `Segna come risolto: ${alert.title}`
                }
            >
                {isResolved ? (
                    <>
                        <XCircle className="w-4 h-4 text-gray-400" aria-hidden="true" />
                        <span>Riattiva</span>
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4 text-green-400" aria-hidden="true" />
                        <span>Risolto</span>
                    </>
                )}
            </button>
        </article>
    );
}