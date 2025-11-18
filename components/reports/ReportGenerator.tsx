import React, { useState } from 'react';
import { subDays } from 'date-fns';
import { Card, CardContent } from '../ui/Card';
import { ReportPreview } from './ReportPreview';
import { ChevronDown } from 'lucide-react';

type ReportType = 'monthly_management' | 'channel_performance' | 'store_specific';
type Step = 1 | 2 | 3 | 4;

const reportOptions: { value: ReportType, label: string, description: string }[] = [
    { value: 'monthly_management', label: 'Report Mensile Direzione', description: 'Summary di KPI, advertising, performance negozi e venditori.' },
    { value: 'channel_performance', label: 'Report Performance Canali', description: 'Analisi dettagliata di ROAS, spesa e metriche per canale adv.' },
    { value: 'store_specific', label: 'Report Negozio Specifico', description: 'Drill-down su un singolo negozio, con benchmark e performance venditori.' },
];

export function ReportGenerator() {
    const [step, setStep] = useState<Step>(1);
    const [reportType, setReportType] = useState<ReportType>('monthly_management');
    const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 29), to: new Date() });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setStep(4);
        }, 1500); // Simulate generation time
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: return (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Step 1: Seleziona Report</h3>
                    <p className="text-sm text-gray-400 mb-4">Scegli uno dei template predefiniti per iniziare.</p>
                    <div className="relative">
                         <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value as ReportType)}
                            className="appearance-none w-full bg-gray-700 px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {reportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-300">{reportOptions.find(r => r.value === reportType)?.description}</p>
                    </div>
                </div>
            );
            case 2: return (
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Step 2: Configurazione</h3>
                    <p className="text-sm text-gray-400 mb-4">Imposta il periodo di riferimento per il report.</p>
                    {/* A proper date range picker would go here. For now, we use the default. */}
                    <p className="text-gray-300">Periodo: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}</p>
                </div>
            );
            case 3: return (
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Step 3: Output</h3>
                    <p className="text-sm text-gray-400 mb-4">Pronto per generare il report.</p>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500"
                    >
                        {isGenerating ? 'Generazione in corso...' : 'Genera Report'}
                    </button>
                </div>
            );
            case 4: return (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Step 4: Preview & Download</h3>
                    <p className="text-sm text-gray-400 mb-4">Ecco l'anteprima del tuo report. Puoi scaricarlo o programmarne l'invio.</p>
                    <div className="flex gap-4">
                        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Download PDF</button>
                        <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Programma Invio</button>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardContent className="p-6">
                   {renderStepContent()}
                   <div className="flex justify-between mt-6">
                       <button onClick={() => setStep(s => Math.max(1, s - 1) as Step)} disabled={step === 1 || step === 4} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Indietro</button>
                       <button onClick={() => setStep(s => Math.min(3, s + 1) as Step)} disabled={step >= 3} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Avanti</button>
                   </div>
                </CardContent>
            </Card>
            <div className="lg:col-span-2">
                {step === 4 ? (
                    <ReportPreview reportType={reportType} dateRange={dateRange} />
                ) : (
                    <Card className="h-full min-h-[500px] flex items-center justify-center bg-gray-800/30 border-2 border-dashed border-gray-700">
                        <p className="text-gray-500">L'anteprima del report apparirà qui</p>
                    </Card>
                )}
            </div>
        </div>
    );
}