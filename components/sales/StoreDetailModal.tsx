import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { DataTable, type ColumnDef } from '../ui/DataTable';
import type { StoreTableRow, StoreDetails } from '../../hooks/useSalesData';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useModal } from '../../hooks/useModal';

interface StoreDetailModalProps {
  store: StoreTableRow;
  storeDetails: StoreDetails;
  onClose: () => void;
}

const salesRepColumns: ColumnDef<StoreDetails['salesReps'][0]>[] = [
    { accessorKey: 'nome', header: 'Venditore' },
    { accessorKey: 'vendite', header: 'Vendite' },
    { accessorKey: 'fatturato', header: 'Fatturato', cell: info => `€${info.getValue<number>().toLocaleString()}`},
    { accessorKey: 'conversionRate', header: 'Conv. Rate', cell: info => `${info.getValue<number>().toFixed(1)}%` },
    { accessorKey: 'scontrinoMedio', header: 'Scontrino Medio', cell: info => `€${info.getValue<number>().toLocaleString()}`},
];

const PIE_COLORS = ['#16a34a', '#15803d', '#166534', '#14532d', '#052e16'];

export function StoreDetailModal({ store, storeDetails, onClose }: StoreDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { modalRef } = useModal({ isOpen: true, onClose, initialFocusRef: closeButtonRef });

  if (!storeDetails) return null;

  const revenuePercentage = (store.fatturato / storeDetails.kpis.targetMensile) * 100;
  const modalTitleId = `store-modal-title-${store.nome.replace(/\s+/g, '-')}`;
  const modalDescId = `store-modal-desc-${store.nome.replace(/\s+/g, '-')}`;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        aria-describedby={modalDescId}
        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <div>
            <h2 id={modalTitleId} className="text-xl font-bold text-white">{store.nome}</h2>
            <p id={modalDescId} className="text-sm text-gray-400">{store.citta} - Manager: {store.manager}</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            aria-label={`Chiudi dettagli ${store.nome}`}
          >
            <X className="w-6 h-6 text-gray-300" aria-hidden="true" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader><CardTitle className="text-sm">Walk-in Giornalieri</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{storeDetails.kpis.walkinGiornalieriMedi}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-sm">Tasso Pres. Appuntamenti</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{storeDetails.kpis.tassoPresentazioneAppuntamenti.toFixed(1)}%</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-sm">Tempo Medio Chiusura</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{storeDetails.kpis.tempoMedioChiusuraTrattativa} gg</p></CardContent>
            </Card>
            <Card className="md:col-span-4">
                <CardHeader><CardTitle className="text-sm">Fatturato vs Target Mensile</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-lg whitespace-nowrap">€{store.fatturato.toLocaleString()} / €{storeDetails.kpis.targetMensile.toLocaleString()}</span>
                        <ProgressBar value={revenuePercentage} />
                        <span className="font-bold text-lg">{revenuePercentage.toFixed(1)}%</span>
                    </div>
                </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Trend Fatturato (12 mesi)</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={storeDetails.charts.trendFatturato}>
                            <XAxis dataKey="mese" stroke="#9ca3af" fontSize={12} />
                            <YAxis tickFormatter={(v) => `€${v/1000}k`} stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} formatter={(v: number) => `€${v.toLocaleString()}`} />
                            <Line type="monotone" dataKey="fatturato" stroke="#22d3ee" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Vendite per Venditore</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={storeDetails.charts.venditePerVenditore} dataKey="vendite" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label>
                               {storeDetails.charts.venditePerVenditore.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => `${v} vendite`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Prodotti più venduti (Top 10)</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={storeDetails.charts.prodottiPiuVenduti}>
                             <XAxis dataKey="modello" stroke="#9ca3af" fontSize={12} />
                             <YAxis stroke="#9ca3af" fontSize={12}/>
                             <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} />
                             <Bar dataKey="vendite" fill="#14b8a6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
          </section>

          <section>
              <Card>
                <CardHeader><CardTitle>Performance Venditori del Negozio</CardTitle></CardHeader>
                <CardContent>
                    <DataTable columns={salesRepColumns} data={storeDetails.salesReps} />
                </CardContent>
              </Card>
          </section>

        </div>
      </div>
    </div>
  );
}