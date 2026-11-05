import { describe, expect, it } from 'vitest';
import { calculateMetrics, type KpiInput } from '../lib/kpi';
import { CanaleEnum } from '../types';

const day = new Date('2026-01-15');

const input: KpiInput = {
  spese: [
    { id: 's1', data: day, canale: CanaleEnum.Meta, spesa: 1000, impression: 100000, click: 2000 },
    { id: 's2', data: day, canale: CanaleEnum.Google, spesa: 1000, impression: 80000, click: 3000 },
  ],
  vendite: [
    { id: 'v1', data_vendita: day, negozio_id: 1, lead_id: 'l1', importo_totale: 10000, modello_cucina: 'A', giorni_dalla_lead: 10, margine_percentuale: 0.3 },
    { id: 'v2', data_vendita: day, negozio_id: 2, lead_id: 'l2', importo_totale: 20000, modello_cucina: 'B', giorni_dalla_lead: 12, margine_percentuale: 0.25 },
    { id: 'v3', data_vendita: day, negozio_id: 1, lead_id: null, importo_totale: 5000, modello_cucina: 'C', giorni_dalla_lead: null, margine_percentuale: 0.2 },
  ],
  leads: [
    { id: 'l1', data_generazione: day, canale_provenienza: CanaleEnum.Meta, negozio_assegnato_id: 1, stato: 'venduto' },
    { id: 'l2', data_generazione: day, canale_provenienza: CanaleEnum.Google, negozio_assegnato_id: 2, stato: 'venduto' },
    { id: 'l3', data_generazione: day, canale_provenienza: CanaleEnum.Google, negozio_assegnato_id: 2, stato: 'perso' },
    { id: 'l4', data_generazione: day, canale_provenienza: CanaleEnum.Meta, negozio_assegnato_id: 1, stato: 'nuovo' },
  ],
  activeNegozi: [
    { id: 1, nome: 'A', citta: 'X', metri_quadri: 100 },
    { id: 2, nome: 'B', citta: 'Y', metri_quadri: 200 },
  ],
};

describe('calculateMetrics', () => {
  const m = calculateMetrics(input);

  it('sums advertising spend', () => {
    expect(m.spesaAdvTotale).toBe(2000);
  });

  it('computes ROAS from lead-attributed revenue only', () => {
    expect(m.fatturatoDaLead).toBe(30000);
    expect(m.roas).toBe(15);
  });

  it('computes MER from total revenue, including sales without a lead', () => {
    expect(m.venditeTotali).toBe(35000);
    expect(m.mer).toBe(17.5);
  });

  it('computes CAC as spend per sold lead', () => {
    expect(m.leadsVendutiCount).toBe(2);
    expect(m.cac).toBe(1000);
  });

  it('computes conversion rate as sold leads over all leads', () => {
    expect(m.conversionRate).toBe(0.5);
  });

  it('computes profit per square metre of the active stores', () => {
    // 10000*0.3 + 20000*0.25 + 5000*0.2 = 9000 over 300 mq
    expect(m.profittoTotale).toBe(9000);
    expect(m.profitabilitaPerMq).toBe(30);
  });

  it('returns 0 instead of NaN/Infinity on an empty period', () => {
    const empty = calculateMetrics({ vendite: [], leads: [], spese: [], activeNegozi: [] });
    expect(empty.roas).toBe(0);
    expect(empty.mer).toBe(0);
    expect(empty.cac).toBe(0);
    expect(empty.conversionRate).toBe(0);
    expect(empty.profitabilitaPerMq).toBe(0);
  });

  it('returns CAC 0 when there is spend but no sold lead', () => {
    const noSales = calculateMetrics({ ...input, leads: input.leads.filter(l => l.stato !== 'venduto') });
    expect(noSales.cac).toBe(0);
  });
});
