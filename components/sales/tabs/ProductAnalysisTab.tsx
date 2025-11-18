import React from 'react';
import { Package, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DataTable, type ColumnDef } from '../../ui/DataTable';
import { Treemap } from '../../ui/Treemap';
import type { ProductData, ProductTableRow } from '../../../hooks/useSalesData';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductAnalysisTabProps {
  data: ProductData;
  isLoading: boolean;
}

const columns: ColumnDef<ProductTableRow>[] = [
    { accessorKey: 'modello', header: 'Modello Cucina', cell: info => <div className="font-medium">{info.getValue<string>()}</div> },
    { accessorKey: 'categoriaPrezzo', header: 'Categoria Prezzo' },
    { accessorKey: 'vendite', header: 'N° Vendite' },
    { accessorKey: 'percentualeSulTotale', header: '% sul Totale', cell: info => `${info.getValue<number>().toFixed(1)}%` },
    { accessorKey: 'fatturato', header: 'Fatturato', cell: info => `€${info.getValue<number>().toLocaleString()}` },
    { accessorKey: 'margineMedio', header: 'Margine Medio', cell: info => `${info.getValue<number>().toFixed(1)}%` },
];

const PIE_COLORS = ['#fbbf24', '#f97316', '#ef4444'];

export function ProductAnalysisTab({ data, isLoading }: ProductAnalysisTabProps) {
  if (isLoading) return <div>Loading product analysis data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Vendite con Accessori</CardTitle><Percent className="w-5 h-5 text-gray-400"/></CardHeader>
            <CardContent><p className="text-2xl font-bold">{data.upselling.percentVenditeConAccessori.toFixed(1)}%</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Valore Medio Accessori</CardTitle><DollarSign className="w-5 h-5 text-gray-400"/></CardHeader>
            <CardContent><p className="text-2xl font-bold">€{data.upselling.valoreMedioAccessori.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Top Combo Prodotto+Acc</CardTitle><Package className="w-5 h-5 text-gray-400"/></CardHeader>
            <CardContent><p className="text-lg font-bold truncate">{data.upselling.topCombo}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Analisi Performance Prodotti</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data.products} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Modelli per Fatturato Generato</CardTitle></CardHeader>
            <CardContent>
                <div className="w-full h-[400px]">
                    <Treemap data={data.products.map(p => ({ name: p.modello, size: p.fatturato }))} />
                </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Distribuzione Vendite per Categoria</CardTitle></CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie data={data.venditePerCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {data.venditePerCategoria.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toLocaleString()} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}