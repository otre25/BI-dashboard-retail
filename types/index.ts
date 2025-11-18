export enum CanaleEnum {
  Meta = 'meta',
  Google = 'google',
  Programmatic = 'programmatic',
}

export interface Negozio {
  id: number;
  nome: string;
  citta: string;
  metri_quadri: number;
}

export interface SpesaAdvertising {
  id: string;
  data: Date;
  canale: CanaleEnum;
  spesa: number;
  impression: number;
  click: number;
}

export type LeadStato = 'nuovo' | 'contattato' | 'appuntamento_fissato' | 'appuntamento_presentato' | 'venduto' | 'perso';

export interface Lead {
  id: string;
  data_generazione: Date;
  canale_provenienza: CanaleEnum;
  negozio_assegnato_id: number;
  stato: LeadStato;
}

export interface Vendita {
  id: string;
  data_vendita: Date;
  negozio_id: number;
  lead_id: string | null;
  importo_totale: number;
  modello_cucina: string;
  giorni_dalla_lead: number | null;
  margine_percentuale: number;
}

export interface KpiData {
  roas: number;
  cac: number;
  conversionRate: number;
  profitabilitaPerMq: number;
  venditeTotali: number;
  spesaAdvTotale: number;
  leadsTotali: number;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface MapStoreData {
  id: number;
  citta: string;
  nome: string;
  fatturato: number;
  profitabilitaPerMq: number;
}
