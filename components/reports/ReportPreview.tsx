import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useKPIData } from '../../hooks/useAnalyticsData';
import { useSalesData } from '../../hooks/useSalesData';
import { KpiGrid } from '../KpiGrid';
import { ChannelROASChart } from '../RoasByChannelChart';
import { DataTable } from '../ui/DataTable';

interface ReportPreviewProps {
    reportType: 'monthly_management' | 'channel_performance' | 'store_specific';
    dateRange: { from: Date; to: Date; };
}

// FIX: Make children prop optional to fix TS error.
const Page = ({ children, pageNumber, totalPages }: { children?: React.ReactNode, pageNumber: number, totalPages: number }) => (
    <div className="bg-white text-gray-800 shadow-lg p-8 A4-aspect-ratio mb-6 relative">
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                <span className="font-bold">BI Dashboard Cucine</span>
            </div>
            <span>{new Date().toLocaleDateString()}</span>
        </header>
        
        <main className="h-full pt-8">
            {children}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-500">
            Pagina {pageNumber} di {totalPages}
        </footer>
    </div>
);


const MonthlyManagementReport = ({ dateRange }: { dateRange: { from: Date, to: Date }}) => {
    const { data: kpiData } = useKPIData(dateRange.from, dateRange.to, 'all', 'all');
    const { data: salesData } = useSalesData(dateRange.from, dateRange.to);

    return (
        <>
            <Page pageNumber={1} totalPages={3}>
                <h1 className="text-2xl font-bold text-center mb-2">Report Mensile Direzione</h1>
                <p className="text-center text-gray-600 mb-6">{dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}</p>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Executive Summary</h2>
                <div className="text-sm">
                    <p className="mb-2">Il mese ha mostrato un andamento positivo complessivo con un ROAS globale di <strong>{kpiData.kpis.roas.value.toFixed(2)}x</strong>. L'investimento pubblicitario totale è stato di <strong>€{kpiData.kpis.spesaAdv.value.toLocaleString()}</strong>, generando un fatturato di <strong>€{kpiData.kpis.fatturato.value.toLocaleString()}</strong>.</p>
                    <p className="mb-2"><strong>Highlight:</strong> Il canale Google si conferma il più performante. Il negozio di Milano Centro ha registrato la migliore redditività per m².</p>
                    <p><strong>Criticità:</strong> Il canale Programmatic mostra un ROAS inferiore al target. Alcuni venditori necessitano di training sul tasso di conversione.</p>
                </div>
                <div className="mt-8">
                    <h3 className="text-md font-semibold mb-4">KPI Principali</h3>
                    <KpiGrid kpiData={kpiData.kpis} isLoading={false} />
                </div>
            </Page>
            <Page pageNumber={2} totalPages={3}>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Analisi Advertising</h2>
                <div className="h-[300px] w-full mb-8">
                    <ChannelROASChart data={kpiData.roasByChannel} isLoading={false} />
                </div>
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Performance Negozi (Top 5 per €/m²)</h2>
                 <DataTable 
                    columns={[
                        { accessorKey: 'rank', header: '#' },
                        { accessorKey: 'nome', header: 'Negozio' },
                        { accessorKey: 'fatturato', header: 'Fatturato', cell: info => `€${info.getValue<number>().toLocaleString()}`},
                        { accessorKey: 'profitabilitaPerMq', header: '€/m²', cell: info => `€${info.getValue<number>().toLocaleString()}`},
                    ]} 
                    data={salesData.stores.stores.slice(0,5)} 
                />
            </Page>
        </>
    );
};


export function ReportPreview({ reportType, dateRange }: ReportPreviewProps) {
    const renderReport = () => {
        switch(reportType) {
            case 'monthly_management':
                return <MonthlyManagementReport dateRange={dateRange} />;
            // Add other report types here
            default:
                return <Page pageNumber={1} totalPages={1}><p>Report template non ancora implementato.</p></Page>;
        }
    }
    
    return (
        <div className="bg-gray-600 p-6 rounded-lg overflow-y-auto max-h-[80vh]">
            <style>{`.A4-aspect-ratio { aspect-ratio: 1 / 1.414; }`}</style>
            {renderReport()}
        </div>
    );
}