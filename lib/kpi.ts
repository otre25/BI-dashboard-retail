import type { Vendita, SpesaAdvertising, Lead, Negozio } from '../types';

export interface KpiInput {
  vendite: Vendita[];
  leads: Lead[];
  spese: SpesaAdvertising[];
  activeNegozi: Negozio[];
}

const ratio = (num: number, den: number): number => (den > 0 ? num / den : 0);

export const calculateMetrics = (data: KpiInput) => {
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
    roas: ratio(fatturatoDaLead, spesaAdvTotale),
    mer: ratio(venditeTotali, spesaAdvTotale),
    cac: ratio(spesaAdvTotale, leadsVendutiCount),
    conversionRate: ratio(leadsVendutiCount, leadsTotali),
    profitabilitaPerMq: ratio(profittoTotale, metriQuadriTotali),
  };
};
