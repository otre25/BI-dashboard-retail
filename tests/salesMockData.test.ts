import { describe, expect, it } from 'vitest';
import { venditaData, negozi } from '../lib/mockData';
import { appointments, sales, salesReps, stores } from '../lib/salesMockData';

describe('sales mock data', () => {
  it('reuses the core dataset: same stores, same sales, same revenue', () => {
    expect(stores.map(s => s.id)).toEqual(negozi.map(n => n.id));
    expect(sales.length).toBe(venditaData.length);
    const core = venditaData.reduce((sum, v) => sum + v.importo_totale, 0);
    const mock = sales.reduce((sum, s) => sum + s.importo, 0);
    expect(mock).toBeCloseTo(core, 2);
  });

  it('gives every store at least one sales rep, and assigns work only within the store', () => {
    expect(stores.every(s => salesReps.some(r => r.negozio_id === s.id))).toBe(true);
    const repStore = new Map(salesReps.map(r => [r.id, r.negozio_id]));
    expect(appointments.every(a => repStore.get(a.venditore_id) === a.negozio_id)).toBe(true);
    expect(sales.every(s => repStore.get(s.venditore_id) === s.negozio_id)).toBe(true);
  });

  it('only uses advertising channels as lead sources', () => {
    const sources = new Set([...appointments.map(a => a.fonte), ...sales.map(s => s.fonte_lead)]);
    expect([...sources].sort()).toEqual(['Google', 'Meta', 'Programmatic']);
  });

  it('closes appointments as sales in line with the funnel', () => {
    const presented = appointments.filter(a => a.esito !== 'no-show').length;
    const closed = appointments.filter(a => a.esito === 'vendita').length;
    expect(closed / presented).toBeGreaterThan(0.1);
    expect(closed / presented).toBeLessThan(0.4);
  });
});
