import { appuntamentiData, negozi, venditaData } from './mockData';

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

// Anagrafica coerente con il dataset centrale (lib/mockData): stessi negozi, stesse vendite.
const MANAGER_BY_STORE: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 1, 5: 2, 6: 1, 7: 3, 8: 1, 9: 3, 10: 3, 11: 2, 12: 2, 13: 2, 14: 1, 15: 1,
};

export const stores: Store[] = negozi.map(n => ({ ...n, manager_id: MANAGER_BY_STORE[n.id] }));

// Ogni negozio ha almeno un venditore; i primi dieci sono nominativi, gli altri generici.
const EXTRA_REP_STORES = [9, 10, 11, 12, 13, 14, 15, 3, 2, 1];

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
    ...EXTRA_REP_STORES.map((negozio_id, i) => ({ id: 11 + i, nome: `Venditore ${11 + i}`, negozio_id })),
];

export const products: Product[] = [
    { id: 1, modello: "Modello A", categoria: 'entry', prezzo_base: 6000, margine_medio: 0.20 },
    { id: 2, modello: "Modello B", categoria: 'mid', prezzo_base: 9000, margine_medio: 0.25 },
    { id: 3, modello: "Modello C", categoria: 'mid', prezzo_base: 12000, margine_medio: 0.28 },
    { id: 4, modello: "Modello D", categoria: 'premium', prezzo_base: 18000, margine_medio: 0.35 },
    { id: 5, modello: "Modello E", categoria: 'premium', prezzo_base: 25000, margine_medio: 0.40 },
];

// Assegna in modo stabile (stessa chiave = stesso venditore) senza altro stato casuale.
const hashString = (value: string): number => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const repFor = (storeId: number, key: string): SalesRep => {
  const reps = salesReps.filter(r => r.negozio_id === storeId);
  return reps[hashString(key) % reps.length];
};

const channelLabel = (canale: string): string => canale.charAt(0).toUpperCase() + canale.slice(1);

export const appointments: Appointment[] = appuntamentiData.map((a, index) => ({
    id: index + 1,
    data: a.data,
    negozio_id: a.negozio_id,
    venditore_id: repFor(a.negozio_id, a.lead_id).id,
    fonte: channelLabel(a.canale),
    esito: a.esito,
}));

const leadChannel = new Map(appuntamentiData.map(a => [a.lead_id, a.canale]));
const productByModel = new Map(products.map(p => [p.modello, p]));

export const sales: Sale[] = venditaData.flatMap((v, index) => {
    const canale = v.lead_id ? leadChannel.get(v.lead_id) : undefined;
    const product = productByModel.get(v.modello_cucina);
    if (!canale || !product) return [];
    return [{
        id: index + 1,
        data: v.data_vendita,
        negozio_id: v.negozio_id,
        venditore_id: repFor(v.negozio_id, v.lead_id ?? v.id).id,
        prodotto_id: product.id,
        importo: v.importo_totale,
        fonte_lead: channelLabel(canale),
    }];
});
