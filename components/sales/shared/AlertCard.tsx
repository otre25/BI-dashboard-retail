import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface AlertCardProps {
    title: string;
    items: string[];
    emptyText: string;
    icon: React.ReactNode;
}

export function AlertCard({ title, items, emptyText, icon }: AlertCardProps) {
    const cardId = `alert-card-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle id={cardId} className="text-base font-medium flex items-center gap-2">
                    {icon}
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <ul
                        className="space-y-1 text-sm text-gray-300"
                        aria-labelledby={cardId}
                        role="list"
                    >
                        {items.map((item, index) => (
                            <li key={index} className="truncate" title={item}>{item}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500" aria-live="polite">{emptyText}</p>
                )}
                {items.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                        {items.length} {items.length === 1 ? 'elemento' : 'elementi'}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}