import { useMemo } from 'react';
import { isWithinInterval, subDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
// FIX: Import types used within this file to resolve 'Cannot find name' errors.
import type { StoreTableRow, SalesRepTableRow, ProductTableRow, LeadSourceTableRow, StorePerformanceData, SalesRepData, ProductData, LeadSourceData, StoreDetails } from '../lib/salesMockData';
import { stores, salesReps, products, appointments, sales, managers } from '../lib/salesMockData';
// FIX: Export types for consumers of the useSalesData hook
export type { StoreTableRow, SalesRepTableRow, ProductTableRow, LeadSourceTableRow, StorePerformanceData, SalesRepData, ProductData, LeadSourceData, StoreDetails } from '../lib/salesMockData';

const useFilteredSalesData = (startDate: Date, endDate: Date) => {
    return useMemo(() => {
        const interval = { start: startDate, end: endDate };
        return sales.filter(s => isWithinInterval(s.data, interval));
    }, [startDate, endDate]);
};

export const useSalesData = (startDate: Date, endDate: Date) => {
    const filteredSales = useFilteredSalesData(startDate, endDate);

    const data = useMemo(() => {
        // STORES
        const storePerformance: Omit<StoreTableRow, 'rank' | 'isUnderperforming'>[] = stores.map(store => {
            const storeSales = filteredSales.filter(s => s.negozio_id === store.id);
            const fatturato = storeSales.reduce((sum, s) => sum + s.importo, 0);
            const vendite = storeSales.length;
            const appuntamentiPeriodo = appointments.filter(a => a.negozio_id === store.id && isWithinInterval(a.data, {start: startDate, end: endDate}));
            const appuntamentiChiusi = appuntamentiPeriodo.filter(a => a.esito === 'vendita').length;

            return {
                id: store.id,
                nome: store.nome,
                citta: store.citta,
                manager: managers.find(m => m.id === store.manager_id)?.nome || 'N/D',
                fatturato,
                vendite,
                scontrinoMedio: vendite > 0 ? fatturato / vendite : 0,
                tassoChiusura: appuntamentiPeriodo.length > 0 ? (appuntamentiChiusi / appuntamentiPeriodo.length) * 100 : 0,
                profitabilitaPerMq: store.metri_quadri > 0 ? fatturato / store.metri_quadri : 0,
            }
        });

        const avgProfitabilita = storePerformance.reduce((sum, s) => sum + s.profitabilitaPerMq, 0) / storePerformance.length;
        const rankedStores = storePerformance
            .sort((a,b) => b.profitabilitaPerMq - a.profitabilitaPerMq)
            .map((s, index) => ({
                ...s,
                rank: index + 1,
                isUnderperforming: s.profitabilitaPerMq < avgProfitabilita * 0.8,
            }));
        
        const storeDetails: { [key: number]: StoreDetails } = Object.fromEntries(
            stores.map(store => {
                const storeSales = sales.filter(s => s.negozio_id === store.id);
                const salesRepsInStore = salesReps.filter(sr => sr.negozio_id === store.id).map(sr => {
                    const repSales = storeSales.filter(s => s.venditore_id === sr.id);
                    const fatturato = repSales.reduce((sum, s) => sum + s.importo, 0);
                    const vendite = repSales.length;
                     return {
                        id: sr.id,
                        nome: sr.nome,
                        vendite,
                        fatturato,
                        conversionRate: 25.5, // Mock
                        scontrinoMedio: vendite > 0 ? fatturato / vendite : 0,
                     };
                });
                
                const productSalesCount: {[key: string]: number} = {};
                storeSales.forEach(s => {
                    const productName = products.find(p => p.id === s.prodotto_id)?.modello || 'N/D';
                    productSalesCount[productName] = (productSalesCount[productName] || 0) + 1;
                });

                return [store.id, {
                    kpis: {
                        targetMensile: 150000, walkinGiornalieriMedi: 12,
                        tassoPresentazioneAppuntamenti: 85.2, tempoMedioChiusuraTrattativa: 14,
                    },
                    charts: {
                        trendFatturato: Array.from({length: 12}, (_, i) => ({mese: format(subDays(endDate, i*30), 'MMM'), fatturato: 50000 + Math.random()*20000})).reverse(),
                        venditePerVenditore: salesRepsInStore.map(sr => ({nome: sr.nome, vendite: sr.vendite})),
                        prodottiPiuVenduti: Object.entries(productSalesCount).sort((a,b) => b[1] - a[1]).slice(0,10).map(([modello, vendite]) => ({modello, vendite})),
                    },
                    salesReps: salesRepsInStore,
                }];
            })
        );
        const storesData: StorePerformanceData = { stores: rankedStores, details: storeDetails };

        // SALES REPS
        const repPerformance: Omit<SalesRepTableRow, 'rank'>[] = salesReps.map(rep => {
            const repSales = filteredSales.filter(s => s.venditore_id === rep.id);
            const fatturato = repSales.reduce((sum, s) => sum + s.importo, 0);
            const vendite = repSales.length;
            const appuntamentiPeriodo = appointments.filter(a => a.venditore_id === rep.id && isWithinInterval(a.data, {start: startDate, end: endDate}));

            return {
                id: rep.id,
                nome: rep.nome,
                negozio: stores.find(s => s.id === rep.negozio_id)?.citta || 'N/D',
                leadGestiti: appuntamentiPeriodo.length,
                vendite,
                conversionRate: appuntamentiPeriodo.length > 0 ? (vendite / appuntamentiPeriodo.length) * 100 : 0,
                fatturato,
                scontrinoMedio: vendite > 0 ? fatturato / vendite : 0,
            };
        });

        // FIX: Explicitly type `rankedReps` to help TypeScript understand the shape of the data, fixing property access errors.
        const rankedReps: SalesRepTableRow[] = repPerformance
            .sort((a,b) => b.fatturato - a.fatturato)
            .map((r, i) => ({ ...r, rank: i + 1 }));

        const salesRepsData: SalesRepData = {
            reps: rankedReps,
            alerts: {
                needsTraining: rankedReps.filter(r => r.conversionRate > 0 && r.conversionRate < 10).map(r => `${r.nome} (${r.negozio})`),
                overTarget: rankedReps.filter(r => r.fatturato > 50000).map(r => `${r.nome} (€${r.fatturato.toLocaleString()})`),
                inactive: [],
            }
        };

        // PRODUCTS
        const productPerformance: ProductTableRow[] = products.map(p => {
            const productSales = filteredSales.filter(s => s.prodotto_id === p.id);
            const fatturato = productSales.reduce((sum, s) => sum + s.importo, 0);
            return {
                id: p.id,
                modello: p.modello,
                categoriaPrezzo: p.categoria,
                vendite: productSales.length,
                percentualeSulTotale: filteredSales.length > 0 ? (productSales.length / filteredSales.length) * 100 : 0,
                fatturato,
                margineMedio: p.margine_medio * 100,
            };
        }).sort((a,b) => b.fatturato - a.fatturato);
        
        const productsData: ProductData = {
            products: productPerformance,
            upselling: {
                percentVenditeConAccessori: 65.4,
                valoreMedioAccessori: 1250,
                topCombo: "Modello A + Pacchetto Elettrodomestici Premium",
            },
            venditePerCategoria: Object.entries(
                productPerformance.reduce((acc, p) => {
                    acc[p.categoriaPrezzo] = (acc[p.categoriaPrezzo] || 0) + p.vendite;
                    return acc;
                }, {} as {[key:string]: number})
            ).map(([name, value]) => ({name, value})),
        };
        
        // LEAD SOURCES
        const leadSources = ['Meta', 'Google', 'Walk-in', 'Referral'];
        const leadSourcePerformance: LeadSourceTableRow[] = leadSources.map(source => {
            const sourceSales = filteredSales.filter(s => s.fonte_lead === source);
            const sourceAppointments = appointments.filter(a => a.fonte === source && isWithinInterval(a.data, {start: startDate, end: endDate}));
            const leads = sourceAppointments.length;
            const vendite = sourceSales.length;
            const fatturato = sourceSales.reduce((sum, s) => sum + s.importo, 0);

            return {
                source,
                leads,
                vendite,
                tassoConversioneVendita: leads > 0 ? (vendite / leads) * 100 : 0,
                fatturatoMedioPerVendita: vendite > 0 ? fatturato / vendite : 0,
                ltv: vendite > 0 ? (fatturato / vendite) * 1.5 : 0, // Mock LTV
                funnel: [
                    { stage: 'Lead', value: leads, rate: 100 },
                    { stage: 'App.', value: Math.floor(leads * 0.8), rate: 80 },
                    { stage: 'Vendita', value: vendite, rate: (leads > 0 ? (vendite/leads)*100 : 0) },
                ],
            }
        });

        const leadSourcesData: LeadSourceData = {
            sources: leadSourcePerformance,
            aging: [
                { days: 7, count: 25 },
                { days: 15, count: 12 },
                { days: 30, count: 5 },
            ]
        };

        return {
            stores: storesData,
            salesReps: salesRepsData,
            products: productsData,
            leadSources: leadSourcesData,
        };
    }, [filteredSales, startDate, endDate]);

    return { data, isLoading: false };
};