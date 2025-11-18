import { subDays, eachDayOfInterval } from 'date-fns';

// Types
export interface Manager { id: number; nome: string; }
export interface SalesRep { id: number; nome: string; negozio_id: number; }
export interface Store { id: number; nome: string; citta: string; metri_quadri: number; manager_id: number; }
export interface Product { id: number; modello: string; categoria: 'entry' | 'mid' | 'premium'; prezzo_base: number; margine_medio: number; }
export interface Appointment { id: number; data: Date; negozio_id: number; venditore_id: number; fonte: string; esito: 'presentato' | 'no-show' | 'vendita' | 'perso'; }
export interface Sale { id: number; data: Date; negozio_id: number; venditore_id: number; prodotto_id: number; importo: number; fonte_lead: string; }

export type StoreTableRow = { id: number; rank: number; nome: string; citta: string; manager: string; fatturato: number; scontrinoMedio: number; tassoChiusura: number; profitabilitaPerMq: number; isUnderperforming: boolean; };
export type SalesRepTableRow = { id: number; rank: number; nome: string; negozio: string; leadGestiti: number; vendite: number; conversionRate: number; fatturato: number; scontrinoMedio: number; };
export type ProductTableRow = { id: number; modello: string; categoriaPrezzo: string; vendite: number; percentualeSulTotale: number; fatturato: number; margineMedio: number; };
export type LeadSourceTableRow = { source: string; leads: number; vendite: number; tassoConversioneVendita: number; fatturatoMedioPerVendita: number; ltv: number; funnel: { stage: string, value: number, rate: number }[]; };
export type StoreDetails = { kpis: any; charts: any; salesReps: any[]; };
export type StorePerformanceData = { stores: StoreTableRow[]; details: { [key: number]: StoreDetails } };
export type SalesRepData = { reps: SalesRepTableRow[]; alerts: { needsTraining: string[]; overTarget: string[]; inactive: string[] }};
export type ProductData = { products: ProductTableRow[]; upselling: any; venditePerCategoria: {name: string, value: number}[] };
export type LeadSourceData = { sources: LeadSourceTableRow[]; aging: { days: number, count: number }[] };


// Data
export const managers: Manager[] = [
    { id: 1, nome: "Mario Rossi" },
    { id: 2, nome: "Luca Bianchi" },
    { id: 3, nome: "Anna Verdi" },
];

export const stores: Store[] = [
  { id: 1, nome: "Cucine Milano Centro", citta: "Milano", metri_quadri: 250, manager_id: 1 },
  { id: 2, nome: "Cucine Roma Termini", citta: "Roma", metri_quadri: 300, manager_id: 2 },
  { id: 3, nome: "Cucine Napoli Vomero", citta: "Napoli", metri_quadri: 200, manager_id: 3 },
  { id: 4, nome: "Cucine Torino Re Umberto", citta: "Torino", metri_quadri: 220, manager_id: 1 },
  { id: 5, nome: "Cucine Firenze SMN", citta: "Firenze", metri_quadri: 180, manager_id: 2 },
  { id: 6, nome: "Cucine Bologna Fiera", citta: "Bologna", metri_quadri: 210, manager_id: 1 },
  { id: 7, nome: "Cucine Palermo Politeama", citta: "Palermo", metri_quadri: 190, manager_id: 3 },
  { id: 8, nome: "Cucine Genova Brignole", citta: "Genova", metri_quadri: 170, manager_id: 1 },
  { id: 9, nome: "Cucine Bari Murattiano", citta: "Bari", metri_quadri: 230, manager_id: 3 },
  { id: 10, nome: "Cucine Catania Etnea", citta: "Catania", metri_quadri: 200, manager_id: 3 },
  { id: 11, nome: "Cucine Verona Arena", citta: "Verona", metri_quadri: 160, manager_id: 2 },
  { id: 12, nome: "Cucine Venezia Mestre", citta: "Venezia", metri_quadri: 150, manager_id: 2 },
];

export const salesReps: SalesRep[] = [
    { id: 1, nome: "Paolo Costa", negozio_id: 1 },
    { id: 2, nome: "Francesca Neri", negozio_id: 1 },
    { id: 3, nome: "Marco Esposito", negozio_id: 2 },
    { id: 4, nome: "Giulia Romano", negozio_id: 2 },
    { id: 5, nome: "Alessandro Colombo", negozio_id: 3 },
    { id: 6, nome: "Sara Ricci", negozio_id: 4 },
    { id: 7, nome: "Davide Gallo", negozio_id: 5 },
    { id: 8, nome: "Elena Greco", negozio_id: 6 },
    { id: 9, nome: "Giovanni Conti", negozio_id: 7 },
    { id: 10, nome: "Valentina Moretti", negozio_id: 8 },
    ...Array.from({length: 10}, (_, i) => ({id: 11+i, nome: `Venditore ${11+i}`, negozio_id: stores[i % stores.length].id })),
];

export const products: Product[] = [
    { id: 1, modello: "Modello A", categoria: 'entry', prezzo_base: 6000, margine_medio: 0.20 },
    { id: 2, modello: "Modello B", categoria: 'mid', prezzo_base: 9000, margine_medio: 0.25 },
    { id: 3, modello: "Modello C", categoria: 'mid', prezzo_base: 12000, margine_medio: 0.28 },
    { id: 4, modello: "Modello D", categoria: 'premium', prezzo_base: 18000, margine_medio: 0.35 },
    { id: 5, modello: "Modello E", categoria: 'premium', prezzo_base: 25000, margine_medio: 0.40 },
];

// Generate Mock Data
const today = new Date();
const dateRange = eachDayOfInterval({ start: subDays(today, 365), end: today });
const leadSources = ['Meta', 'Google', 'Walk-in', 'Referral'];

export const appointments: Appointment[] = [];
export const sales: Sale[] = [];

let appointmentId = 1;
let saleId = 1;

dateRange.forEach(date => {
    stores.forEach(store => {
        const repsInStore = salesReps.filter(r => r.negozio_id === store.id);
        if (repsInStore.length === 0) return;
        
        const dailyAppointments = Math.floor(Math.random() * 5) + repsInStore.length;
        for (let i = 0; i < dailyAppointments; i++) {
            const rep = repsInStore[Math.floor(Math.random() * repsInStore.length)];
            const source = leadSources[Math.floor(Math.random() * leadSources.length)];
            
            let esito: Appointment['esito'] = 'presentato';
            if (Math.random() < 0.15) esito = 'no-show';
            else if (Math.random() < 0.30) esito = 'perso';
            else esito = 'vendita';

            appointments.push({
                id: appointmentId++,
                data: date,
                negozio_id: store.id,
                venditore_id: rep.id,
                fonte: source,
                esito
            });
            
            if (esito === 'vendita') {
                const product = products[Math.floor(Math.random() * products.length)];
                sales.push({
                    id: saleId++,
                    data: date,
                    negozio_id: store.id,
                    venditore_id: rep.id,
                    prodotto_id: product.id,
                    importo: product.prezzo_base * (0.9 + Math.random() * 0.2), // variance
                    fonte_lead: source,
                });
            }
        }
    });
});