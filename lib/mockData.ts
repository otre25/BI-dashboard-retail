import { addDays, getMonth, getDay, isAfter, startOfDay, subDays } from 'date-fns';
import type { Negozio, SpesaAdvertising, Lead, Vendita } from '../types';
import { CanaleEnum } from '../types';

export const negozi: Negozio[] = [
  { id: 1, nome: "Cucine Milano Centro", citta: "Milano", metri_quadri: 250 },
  { id: 2, nome: "Cucine Roma Termini", citta: "Roma", metri_quadri: 300 },
  { id: 3, nome: "Cucine Napoli Vomero", citta: "Napoli", metri_quadri: 200 },
  { id: 4, nome: "Cucine Torino Re Umberto", citta: "Torino", metri_quadri: 220 },
  { id: 5, nome: "Cucine Firenze SMN", citta: "Firenze", metri_quadri: 180 },
  { id: 6, nome: "Cucine Bologna Fiera", citta: "Bologna", metri_quadri: 210 },
  { id: 7, nome: "Cucine Palermo Politeama", citta: "Palermo", metri_quadri: 190 },
  { id: 8, nome: "Cucine Genova Brignole", citta: "Genova", metri_quadri: 170 },
  { id: 9, nome: "Cucine Bari Murattiano", citta: "Bari", metri_quadri: 230 },
  { id: 10, nome: "Cucine Catania Etnea", citta: "Catania", metri_quadri: 200 },
  { id: 11, nome: "Cucine Verona Arena", citta: "Verona", metri_quadri: 160 },
  { id: 12, nome: "Cucine Venezia Mestre", citta: "Venezia", metri_quadri: 150 },
  { id: 13, nome: "Cucine Padova Prato", citta: "Padova", metri_quadri: 180 },
  { id: 14, nome: "Cucine Parma Centro", citta: "Parma", metri_quadri: 140 },
  { id: 15, nome: "Cucine Brescia Castello", citta: "Brescia", metri_quadri: 175 },
];

// Dati dimostrativi deterministici (stesso seed = stessi numeri a ogni caricamento),
// calibrati su un retailer di cucine: spesa ~€0.9M/anno, ~2.400 lead/anno,
// stagionalità (picchi in primavera e autunno, calo ad agosto), canali e negozi con rese diverse.

const DEMO_SEED = 20260101;
const HISTORY_DAYS = 395; // 365 visibili + 30 di coda perché le vendite arrivano 5-30 giorni dopo il lead

// PRNG mulberry32: piccolo, veloce, riproducibile.
const createRng = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Moltiplicatore mensile (gennaio = indice 0).
const SEASONALITY = [0.85, 0.95, 1.15, 1.2, 1.15, 0.95, 0.8, 0.55, 1.15, 1.3, 1.25, 0.9];

interface ChannelProfile {
  dailySpend: number; // € medi al giorno
  costPerLead: number; // € per lead
  closeFactor: number; // moltiplicatore del tasso di chiusura (qualità del lead)
}

const CHANNELS: Record<CanaleEnum, ChannelProfile> = {
  [CanaleEnum.Meta]: { dailySpend: 760, costPerLead: 400, closeFactor: 0.85 },
  [CanaleEnum.Google]: { dailySpend: 1250, costPerLead: 420, closeFactor: 1.2 },
  [CanaleEnum.Programmatic]: { dailySpend: 450, costPerLead: 600, closeFactor: 0.5 },
};

// Resa per negozio: peso nei lead, qualità della chiusura e scontrino medio.
const STORE_PROFILES: Record<number, { weight: number; quality: number; ticket: number }> = {
  1: { weight: 1.4, quality: 1.25, ticket: 1.25 }, 2: { weight: 1.5, quality: 1.1, ticket: 1.2 },
  3: { weight: 0.9, quality: 0.8, ticket: 0.85 }, 4: { weight: 1.0, quality: 1.0, ticket: 1.0 },
  5: { weight: 0.8, quality: 1.05, ticket: 1.1 }, 6: { weight: 1.0, quality: 1.15, ticket: 1.0 },
  7: { weight: 0.8, quality: 0.65, ticket: 0.8 }, 8: { weight: 0.7, quality: 0.9, ticket: 0.95 },
  9: { weight: 0.9, quality: 0.85, ticket: 0.85 }, 10: { weight: 0.8, quality: 0.7, ticket: 0.8 },
  11: { weight: 0.8, quality: 1.2, ticket: 1.05 }, 12: { weight: 0.7, quality: 1.0, ticket: 1.0 },
  13: { weight: 0.8, quality: 1.1, ticket: 1.0 }, 14: { weight: 0.6, quality: 0.95, ticket: 0.95 },
  15: { weight: 0.7, quality: 1.0, ticket: 1.0 },
};

const BASE_TICKET = 13000;
const APPOINTMENT_RATE = 0.7;
const SHOW_RATE = 0.85;
const BASE_CLOSE_RATE = 0.32;

const pickWeighted = (rng: () => number, weights: number[]): number => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
};

export const generateDemoData = (today: Date = new Date(), seed: number = DEMO_SEED) => {
  const rng = createRng(seed);
  const end = startOfDay(today);
  const spesaData: SpesaAdvertising[] = [];
  const leadData: Lead[] = [];
  const venditaData: Vendita[] = [];
  const storeWeights = negozi.map(n => STORE_PROFILES[n.id].weight);

  for (let i = 0; i < HISTORY_DAYS; i++) {
    const date = subDays(end, i);
    const weekend = [0, 6].includes(getDay(date)) ? 0.8 : 1;
    const season = SEASONALITY[getMonth(date)] * weekend;

    (Object.keys(CHANNELS) as CanaleEnum[]).forEach(canale => {
      const profile = CHANNELS[canale];
      const spesa = profile.dailySpend * season * (0.85 + rng() * 0.3);
      spesaData.push({
        id: `${canale}-${i}`,
        data: date,
        canale,
        spesa,
        impression: Math.floor(spesa * (canale === CanaleEnum.Programmatic ? 240 : canale === CanaleEnum.Meta ? 110 : 85)),
        click: Math.floor(spesa * (canale === CanaleEnum.Google ? 2.8 : canale === CanaleEnum.Meta ? 1.8 : 1)),
      });

      const expectedLeads = (spesa / profile.costPerLead) * (0.8 + rng() * 0.4);
      const dailyLeads = Math.floor(expectedLeads) + (rng() < expectedLeads % 1 ? 1 : 0);

      for (let j = 0; j < dailyLeads; j++) {
        const store = negozi[pickWeighted(rng, storeWeights)];
        const profileStore = STORE_PROFILES[store.id];
        const lead: Lead = {
          id: `lead-${canale}-${i}-${j}`,
          data_generazione: date,
          canale_provenienza: canale,
          negozio_assegnato_id: store.id,
          stato: 'nuovo',
        };

        if (rng() >= APPOINTMENT_RATE) {
          lead.stato = rng() < 0.4 ? 'contattato' : 'perso';
        } else {
          lead.stato = 'appuntamento_fissato';
          if (rng() < SHOW_RATE) {
            lead.stato = 'appuntamento_presentato';
            const closeRate = Math.min(0.9, BASE_CLOSE_RATE * profile.closeFactor * profileStore.quality);
            if (rng() < closeRate) {
              const giorni = Math.floor(rng() * 25) + 5;
              const dataVendita = addDays(date, giorni);
              // Se la vendita cade nel futuro il lead è ancora in trattativa, non "venduto".
              if (!isAfter(dataVendita, end)) {
                lead.stato = 'venduto';
                venditaData.push({
                  id: `vendita-${canale}-${i}-${j}`,
                  data_vendita: dataVendita,
                  negozio_id: store.id,
                  lead_id: lead.id,
                  importo_totale: BASE_TICKET * profileStore.ticket * (0.6 + rng() * 0.8),
                  modello_cucina: 'Modello ' + String.fromCharCode(65 + Math.floor(rng() * 5)),
                  giorni_dalla_lead: giorni,
                  margine_percentuale: 0.2 + rng() * 0.15,
                });
              }
            } else {
              lead.stato = 'perso';
            }
          }
        }
        leadData.push(lead);
      }
    });
  }

  return { spesaData, leadData, venditaData };
};

export const { spesaData, leadData, venditaData } = generateDemoData();
