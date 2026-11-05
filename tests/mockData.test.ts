import { describe, expect, it } from 'vitest';
import { startOfDay, subDays } from 'date-fns';
import { generateDemoData, negozi } from '../lib/mockData';
import { calculateMetrics } from '../lib/kpi';
import { CanaleEnum } from '../types';

const today = new Date('2026-06-30');
const from = subDays(startOfDay(today), 364);
const data = generateDemoData(today);
const inYear = (d: Date) => d >= from && d <= today;
const spese = data.spesaData.filter(s => inYear(s.data));
const leads = data.leadData.filter(l => inYear(l.data_generazione));
const vendite = data.venditaData.filter(v => inYear(v.data_vendita));

const channelRoas = (canale: CanaleEnum) => {
  const spesa = spese.filter(s => s.canale === canale).reduce((a, s) => a + s.spesa, 0);
  const ids = new Set(leads.filter(l => l.canale_provenienza === canale).map(l => l.id));
  const fatturato = vendite.filter(v => v.lead_id && ids.has(v.lead_id)).reduce((a, v) => a + v.importo_totale, 0);
  return fatturato / spesa;
};

describe('demo data', () => {
  it('is deterministic for the same date and seed', () => {
    const again = generateDemoData(today);
    expect(again.venditaData.length).toBe(data.venditaData.length);
    expect(again.leadData[10]).toEqual(data.leadData[10]);
  });

  it('never contains sales dated after today', () => {
    expect(data.venditaData.every(v => v.data_vendita <= today)).toBe(true);
  });

  it('only marks a lead as sold when its sale exists', () => {
    const saleLeadIds = new Set(data.venditaData.map(v => v.lead_id));
    const sold = data.leadData.filter(l => l.stato === 'venduto');
    expect(sold.every(l => saleLeadIds.has(l.id))).toBe(true);
  });

  it('has a realistic yearly profile for a kitchen retailer', () => {
    const m = calculateMetrics({ spese, leads, vendite, activeNegozi: negozi });
    expect(m.spesaAdvTotale).toBeGreaterThan(700_000);
    expect(m.spesaAdvTotale).toBeLessThan(1_100_000);
    expect(m.roas).toBeGreaterThan(3);
    expect(m.roas).toBeLessThan(9);
    expect(m.cac).toBeGreaterThan(1_500);
    expect(m.cac).toBeLessThan(4_000);
  });

  it('gives each channel a different return, with programmatic below target', () => {
    expect(channelRoas(CanaleEnum.Google)).toBeGreaterThan(channelRoas(CanaleEnum.Meta));
    expect(channelRoas(CanaleEnum.Programmatic)).toBeLessThan(2.5);
  });

  it('shows a clear spread in conversion between stores', () => {
    const rates = negozi.map(n => {
      const l = leads.filter(x => x.negozio_assegnato_id === n.id);
      return l.filter(x => x.stato === 'venduto').length / l.length;
    });
    expect(Math.max(...rates) - Math.min(...rates)).toBeGreaterThan(0.1);
  });
});
