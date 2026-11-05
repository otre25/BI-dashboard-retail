import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { DataTable, type ColumnDef } from './ui/DataTable';
import type { StoreCacResult, StoreCacRow } from '../lib/storeCac';

interface StoreCacTableProps {
  data: StoreCacResult;
  isLoading: boolean;
}

const euro = (value: number) => `€${Math.round(value).toLocaleString('it-IT')}`;

// Sopra +25% della media il negozio costa troppo per vendita; sotto -15% rende bene.
const HIGH_CAC_RATIO = 1.25;
const LOW_CAC_RATIO = 0.85;
// Sotto questa soglia di vendite totali il CAC per negozio è troppo ballerino per fidarsi.
const MIN_RELIABLE_SALES = 60;

export function StoreCacTable({ data, isLoading }: StoreCacTableProps) {
  if (isLoading) return <div>Caricamento CAC per negozio...</div>;

  const { rows, averageCac, unattributedSpend } = data;
  const totalSales = rows.reduce((sum, r) => sum + r.venduti, 0);

  const cacClass = (cac: number | null) => {
    if (cac === null || averageCac === null) return 'text-gray-400';
    if (cac > averageCac * HIGH_CAC_RATIO) return 'text-red-400 font-bold';
    if (cac < averageCac * LOW_CAC_RATIO) return 'text-green-400 font-bold';
    return 'text-gray-200 font-bold';
  };

  const columns: ColumnDef<StoreCacRow>[] = [
    { accessorKey: 'nome', header: 'Negozio', cell: info => <div className="font-medium">{info.getValue<string>()}</div> },
    { accessorKey: 'citta', header: 'Città' },
    { accessorKey: 'leads', header: 'Lead' },
    { accessorKey: 'venduti', header: 'Vendite' },
    { accessorKey: 'spesaAttribuita', header: 'Spesa attribuita', cell: info => euro(info.getValue<number>()) },
    {
      accessorKey: 'cac',
      header: 'CAC',
      cell: ({ row }) => <span className={cacClass(row.original.cac)}>{row.original.cac === null ? 'n/d' : euro(row.original.cac)}</span>,
    },
    {
      id: 'vsMedia',
      header: 'vs media',
      cell: ({ row }) => {
        const { cac } = row.original;
        if (cac === null || averageCac === null) return <span className="text-gray-500">–</span>;
        const delta = (cac / averageCac - 1) * 100;
        return <span className={cacClass(cac)}>{`${delta > 0 ? '+' : ''}${delta.toFixed(0)}%`}</span>;
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>CAC per negozio</CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          {averageCac === null ? 'Nessuna vendita nel periodo.' : `Media: ${euro(averageCac)} per vendita.`}
        </p>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={rows} caption="Costo di acquisizione cliente per negozio" />
        <p className="text-xs text-gray-500 mt-3">
          La spesa pubblicitaria non nasce per negozio: è attribuita in proporzione ai lead ricevuti da ciascuno, canale per canale.
          {totalSales < MIN_RELIABLE_SALES && ' Poche vendite nel periodo: il CAC per negozio è molto variabile, usa 90 giorni o più.'}
          {unattributedSpend > 0 && ` ${euro(unattributedSpend)} di spesa su canali senza lead non è attribuito a nessun negozio.`}
        </p>
      </CardContent>
    </Card>
  );
}
