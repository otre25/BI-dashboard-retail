import React from 'react';
import { Card, CardHeader, CardContent } from './Card';

export const SkeletonCard = () => (
  <Card className="animate-pulse" role="status" aria-label="Caricamento in corso">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 bg-gray-700 rounded w-3/4" aria-hidden="true"></div>
      <div className="h-6 w-6 bg-gray-700 rounded-full" aria-hidden="true"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-gray-700 rounded w-1/2 mb-2" aria-hidden="true"></div>
      <div className="h-3 bg-gray-700 rounded w-full" aria-hidden="true"></div>
    </CardContent>
    <span className="sr-only">Caricamento dati...</span>
  </Card>
);
