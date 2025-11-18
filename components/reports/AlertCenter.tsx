import React, { useState, useMemo } from 'react';
import { useAlertsData, Alert } from '../../hooks/useAlertsData';
import { useAlertStore } from '../../store/useAlertStore';
import { AlertItem } from './AlertItem';
import { cn } from '../../lib/utils';

type Filter = 'active' | 'resolved';

export function AlertCenter() {
    const allAlerts = useAlertsData();
    const { resolvedAlertIds, resolveAlert, unresolveAlert } = useAlertStore();
    const [filter, setFilter] = useState<Filter>('active');

    const filteredAlerts = useMemo(() => {
        return allAlerts.filter(alert => 
            filter === 'active' 
            ? !resolvedAlertIds.includes(alert.id)
            : resolvedAlertIds.includes(alert.id)
        );
    }, [allAlerts, resolvedAlertIds, filter]);

    const groupedAlerts = useMemo(() => {
        const groups: { [key in Alert['priority']]: Alert[] } = {
            critical: [],
            warning: [],
            info: [],
        };
        filteredAlerts.forEach(alert => {
            groups[alert.priority].push(alert);
        });
        return groups;
    }, [filteredAlerts]);

    const handleToggleResolve = (alert: Alert) => {
        if (resolvedAlertIds.includes(alert.id)) {
            unresolveAlert(alert.id);
        } else {
            resolveAlert(alert.id);
        }
    };

    const priorityLabels = {
        critical: 'Critici',
        warning: 'Attenzione',
        info: 'Informativi',
    };

    return (
        <div>
            <div
                className="flex items-center gap-2 bg-gray-800/60 p-1.5 rounded-lg mb-6 max-w-xs"
                role="tablist"
                aria-label="Filtro stato alert"
            >
                <button
                    role="tab"
                    aria-selected={filter === 'active'}
                    aria-controls="alerts-panel"
                    onClick={() => setFilter('active')}
                    className={cn(
                        'w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                        'min-h-[44px]',
                        filter === 'active' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    )}
                >
                    Attivi
                </button>
                <button
                    role="tab"
                    aria-selected={filter === 'resolved'}
                    aria-controls="alerts-panel"
                    onClick={() => setFilter('resolved')}
                    className={cn(
                        'w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                        'min-h-[44px]',
                        filter === 'resolved' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    )}
                >
                    Risolti
                </button>
            </div>

            <div
                id="alerts-panel"
                role="tabpanel"
                aria-label={`Alert ${filter === 'active' ? 'attivi' : 'risolti'}`}
                className="space-y-6"
            >
                {(Object.keys(groupedAlerts) as Array<Alert['priority']>).map(priority => (
                    groupedAlerts[priority].length > 0 && (
                        <section key={priority} aria-labelledby={`alerts-${priority}-heading`}>
                            <h2
                                id={`alerts-${priority}-heading`}
                                className="text-lg font-semibold mb-3 text-gray-300"
                            >
                                {priorityLabels[priority]}
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({groupedAlerts[priority].length})
                                </span>
                            </h2>
                            <div className="space-y-3" role="list">
                                {groupedAlerts[priority].map(alert => (
                                    <AlertItem
                                        key={alert.id}
                                        alert={alert}
                                        isResolved={resolvedAlertIds.includes(alert.id)}
                                        onToggleResolve={() => handleToggleResolve(alert)}
                                    />
                                ))}
                            </div>
                        </section>
                    )
                ))}
                {filteredAlerts.length === 0 && (
                    <div className="text-center py-12" role="status" aria-live="polite">
                        <p className="text-gray-500">Nessun alert {filter === 'active' ? 'attivo' : 'risolto'}.</p>
                    </div>
                )}
            </div>
        </div>
    );
}