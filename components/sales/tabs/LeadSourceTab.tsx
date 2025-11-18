import React from 'react';
import { Funnel, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { AlertCard } from '../shared/AlertCard';
import type { LeadSourceData, LeadSourceTableRow } from '../../../hooks/useSalesData';

interface LeadSourceTabProps {
  data: LeadSourceData;
  isLoading: boolean;
}

const LeadFunnelVisual = ({ funnel }: { funnel: { stage: string, value: number, rate: number }[] }) => (
    <div className="flex items-center space-x-1">
        {funnel.map((step, index) => (
            <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-400">{step.stage}</div>
                    <div className="text-sm font-bold">{step.value}</div>
                </div>
                {index < funnel.length -1 && <div className="text-green-400 text-xs mt-3 mx-1">&rarr; {funnel[index+1].rate.toFixed(0)}%</div>}
            </React.Fragment>
        ))}
    </div>
);


const columns: ColumnDef<LeadSourceTableRow>[] = [
    { accessorKey: 'source', header: 'Fonte', cell: info => <div className="font-medium">{info.getValue<string>()}</div> },
    { accessorKey: 'leads', header: 'Leads' },
    { accessorKey: 'tassoConversioneVendita', header: 'Lead → Vendita %', cell: info => <div className="font-bold text-green-400">{info.getValue<number>().toFixed(1)}%</div> },
    { accessorKey: 'fatturatoMedioPerVendita', header: 'Fatturato Medio', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'ltv', header: 'LTV Stimato', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    // FIX: Add 'id' for action column and access data via row.original
    {id: 'funnel', header: 'Funnel', cell: ({ row }) => <LeadFunnelVisual funnel={row.original.funnel} />},
];

export function LeadSourceTab({ data, isLoading }: LeadSourceTabProps) {
  if (isLoading) return <div>Loading lead source data...</div>;

  return (
    <div className="space-y-6">
        <AlertCard 
            title="Lead Caldi non Seguiti"
            items={data.aging.map(item => `${item.count} lead da ${item.days} giorni`)}
            emptyText="Nessun lead a rischio."
            icon={<AlertTriangle className="w-5 h-5 text-red-400"/>} 
        />
      
      <Card>
        <CardHeader><CardTitle>Analisi Fonti Lead</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data.sources} />
        </CardContent>
      </Card>
      
      {/* Additional charts like Sankey or Lead Source Mix over time could be added here */}
    </div>
  );
}