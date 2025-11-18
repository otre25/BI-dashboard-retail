
import { useMemo } from 'react';
import { isWithinInterval, format, differenceInDays, subDays, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { negozi, spesaData, leadData, venditaData } from '../lib/mockData';
import { CanaleEnum, type Vendita, type SpesaAdvertising, type Lead, type Negozio, type MapStoreData } from '../types';

const useFilteredData = (
  startDate: Date,
  endDate: Date,
  storeIds: 'all' | number[],
  channel: 'all' | CanaleEnum
) => {
  return useMemo(() => {
    const interval = { start: startOfDay(startDate), end: startOfDay(endDate) };

    const vendite = venditaData.filter(v => 
      isWithinInterval(v.data_vendita, interval) &&
      (storeIds === 'all' || storeIds.includes(v.negozio_id))
    );

    const leads = leadData.filter(l => 
        isWithinInterval(l.data_generazione, interval) &&
        (storeIds === 'all' || storeIds.includes(l.negozio_assegnato_id)) &&
        (channel === 'all' || l.canale_provenienza === channel)
    );

    const spese = spesaData.filter(s => 
        isWithinInterval(s.data, interval) &&
        (channel === 'all' || s.canale === channel)
    );
    
    const activeNegozi = negozi.filter(n => storeIds === 'all' || storeIds.includes(n.id));

    return { vendite, leads, spese, activeNegozi };
  }, [startDate, endDate, storeIds, channel]);
};

export const useKPIData = (
    startDate: Date, 
    endDate: Date, 
    storeIds: 'all' | number[], 
    channel: 'all' | CanaleEnum
) => {
    // Current period data
    const currentData = useFilteredData(startDate, endDate, storeIds, channel);

    // Previous period data
    const days = differenceInDays(endDate, startDate) + 1;
    const prevEndDate = subDays(startDate, 1);
    const prevStartDate = subDays(prevEndDate, days -1);
    const previousData = useFilteredData(prevStartDate, prevEndDate, storeIds, channel);

    const kpis = useMemo(() => {
        const calculateMetrics = (data: { vendite: Vendita[], leads: Lead[], spese: SpesaAdvertising[], activeNegozi: Negozio[] }) => {
            const spesaAdvTotale = data.spese.reduce((sum, s) => sum + s.spesa, 0);
            const venditeDaLead = data.vendite.filter(v => v.lead_id);
            const fatturatoDaLead = venditeDaLead.reduce((sum, v) => sum + v.importo_totale, 0);
            const venditeTotali = data.vendite.reduce((sum, v) => sum + v.importo_totale, 0);
            const profittoTotale = data.vendite.reduce((sum, v) => sum + (v.importo_totale * v.margine_percentuale), 0);
            const leadsVendutiCount = data.leads.filter(l => l.stato === 'venduto').length;
            const leadsTotali = data.leads.length;
            const metriQuadriTotali = data.activeNegozi.reduce((sum, n) => sum + n.metri_quadri, 0);

            return {
                spesaAdvTotale,
                fatturatoDaLead,
                venditeTotali,
                profittoTotale,
                leadsVendutiCount,
                leadsTotali,
                roas: spesaAdvTotale > 0 ? fatturatoDaLead / spesaAdvTotale : 0,
                mer: spesaAdvTotale > 0 ? venditeTotali / spesaAdvTotale : 0,
                cac: leadsVendutiCount > 0 ? spesaAdvTotale / leadsVendutiCount : 0,
                conversionRate: leadsTotali > 0 ? leadsVendutiCount / leadsTotali : 0,
                profitabilitaPerMq: metriQuadriTotali > 0 ? profittoTotale / metriQuadriTotali : 0,
            };
        };

        const currentMetrics = calculateMetrics(currentData);
        const previousMetrics = calculateMetrics(previousData);
        
        const getComparison = (current: number, previous: number, reverseColors = false) => {
            if (previous === 0) return { change: 'N/A', color: 'text-gray-400' as const };
            const change = ((current - previous) / previous) * 100;
            let color: 'text-green-400' | 'text-red-400' = change >= 0 ? 'text-green-400' : 'text-red-400';
            if (reverseColors) {
                color = change >= 0 ? 'text-red-400' : 'text-green-400';
            }
            return { change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`, color };
        };

        const sparklineData = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(endDate, 6 - i);
            const sales = currentData.vendite
                .filter(v => format(v.data_vendita, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
                .reduce((sum, v) => sum + v.importo_totale, 0);
            return { date: format(date, 'd MMM'), value: sales };
        });

        return {
            spesaAdv: { value: currentMetrics.spesaAdvTotale, comparison: getComparison(currentMetrics.spesaAdvTotale, previousMetrics.spesaAdvTotale, true) },
            mer: { value: currentMetrics.mer, status: currentMetrics.mer > 5 ? 'green' as const : currentMetrics.mer > 3 ? 'yellow' as const : 'red' as const, comparison: getComparison(currentMetrics.mer, previousMetrics.mer) },
            cac: { value: currentMetrics.cac, comparison: getComparison(currentMetrics.cac, previousMetrics.cac, true) },
            conversionRate: { value: currentMetrics.conversionRate, comparison: getComparison(currentMetrics.conversionRate, previousMetrics.conversionRate) },
            fatturato: { value: currentMetrics.venditeTotali, sparklineData },
            profitabilita: { value: currentMetrics.profitabilitaPerMq, comparison: getComparison(currentMetrics.profitabilitaPerMq, previousMetrics.profitabilitaPerMq) },
        };
    }, [currentData, previousData, endDate]);

    const trendData = useMemo(() => {
        const dataMap = new Map<string, { spesa: number, fatturato: number }>();
        const dateCursor = new Date(startDate);

        while(dateCursor <= endDate) {
            const dateKey = format(dateCursor, 'yyyy-MM-dd');
            dataMap.set(dateKey, { spesa: 0, fatturato: 0 });
            dateCursor.setDate(dateCursor.getDate() + 1);
        }

        currentData.spese.forEach(s => {
            const dateKey = format(s.data, 'yyyy-MM-dd');
            const entry = dataMap.get(dateKey);
            if (entry) entry.spesa += s.spesa;
        });

        currentData.vendite.forEach(v => {
            const dateKey = format(v.data_vendita, 'yyyy-MM-dd');
            const entry = dataMap.get(dateKey);
            if (entry) entry.fatturato += v.importo_totale;
        });

        return Array.from(dataMap.entries()).map(([date, values]) => ({
            date: format(new Date(date), 'd MMM', { locale: it }),
            Spesa: values.spesa,
            Fatturato: values.fatturato,
        }));
    }, [currentData, startDate, endDate]);

    const roasByChannel = useMemo(() => {
        const channelData: Record<CanaleEnum, { spesa: number; fatturato: number }> = {
            [CanaleEnum.Meta]: { spesa: 0, fatturato: 0 },
            [CanaleEnum.Google]: { spesa: 0, fatturato: 0 },
            [CanaleEnum.Programmatic]: { spesa: 0, fatturato: 0 },
        };

        currentData.spese.forEach(s => {
            if (channelData[s.canale]) channelData[s.canale].spesa += s.spesa;
        });

        // FIX: Explicitly type the Map to prevent `get` from returning `unknown`.
        const leadCanaleMap = new Map<string, CanaleEnum>(currentData.leads.map(l => [l.id, l.canale_provenienza]));
        currentData.vendite.forEach(v => {
            if (v.lead_id && leadCanaleMap.has(v.lead_id)) {
                const canale = leadCanaleMap.get(v.lead_id);
                if (canale && channelData[canale]) {
                    channelData[canale].fatturato += v.importo_totale;
                }
            }
        });

        return Object.entries(channelData).map(([canale, data]) => ({
            name: canale.charAt(0).toUpperCase() + canale.slice(1),
            ROAS: data.spesa > 0 ? data.fatturato / data.spesa : 0,
        }));
    }, [currentData]);

    const funnelData = useMemo(() => {
        const leads = currentData.leads.length;
        const appFissati = currentData.leads.filter(l => ['appuntamento_fissato', 'appuntamento_presentato', 'venduto'].includes(l.stato)).length;
        const appPresentati = currentData.leads.filter(l => ['appuntamento_presentato', 'venduto'].includes(l.stato)).length;
        const venduti = currentData.leads.filter(l => l.stato === 'venduto').length;
        
        return [
            { name: 'Lead Generati', value: leads, rate: 100 },
            { name: 'App. Fissati', value: appFissati, rate: leads > 0 ? (appFissati / leads) * 100 : 0 },
            { name: 'App. Presentati', value: appPresentati, rate: appFissati > 0 ? (appPresentati / appFissati) * 100 : 0 },
            { name: 'Vendite Chiuse', value: venduti, rate: appPresentati > 0 ? (venduti / appPresentati) * 100 : 0 },
        ];
    }, [currentData]);

    const storesHeatmap: MapStoreData[] = useMemo(() => {
        // FIX: Explicitly type the Map to prevent `get` from returning `unknown`.
        const performanceMap = new Map<number, Negozio & { fatturato: number; profitto: number; }>(currentData.activeNegozi.map(n => [n.id, { ...n, fatturato: 0, profitto: 0 }]));

        currentData.vendite.forEach(v => {
            const store = performanceMap.get(v.negozio_id);
            if (store) {
                store.fatturato += v.importo_totale;
                store.profitto += v.importo_totale * v.margine_percentuale;
            }
        });

        return Array.from(performanceMap.values()).map(store => ({
            id: store.id,
            nome: store.nome,
            citta: store.citta,
            fatturato: store.fatturato,
            profitabilitaPerMq: store.metri_quadri > 0 ? store.profitto / store.metri_quadri : 0,
        })).sort((a,b) => b.profitabilitaPerMq - a.profitabilitaPerMq);
    }, [currentData]);

    return { 
        data: { kpis, trendData, roasByChannel, funnelData, storesHeatmap },
        isLoading: false // Placeholder for async data fetching
    };
};