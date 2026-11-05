import { describe, expect, it } from 'vitest';
import { calculateStoreCac } from '../lib/storeCac';
import type { KpiInput } from '../lib/kpi';
import { CanaleEnum } from '../types';

const day = new Date('2026-01-15');
const negozi = [
  { id: 1, nome: 'A', citta: 'X', metri_quadri: 100 },
  { id: 2, nome: 'B', citta: 'Y', metri_quadri: 100 },
  { id: 3, nome: 'C', citta: 'Z', metri_quadri: 100 },
];
const lead = (id: string, negozio: number, canale: CanaleEnum, stato: 'venduto' | 'perso') =>
  ({ id, data_generazione: day, canale_provenienza: canale, negozio_assegnato_id: negozio, stato }) as const;

const base: KpiInput = {
  activeNegozi: negozi,
  spese: [
    { id: 's1', data: day, canale: CanaleEnum.Meta, spesa: 1000, impression: 0, click: 0 },
    { id: 's2', data: day, canale: CanaleEnum.Google, spesa: 3000, impression: 0, click: 0 },
  ],
  leads: [
    lead('l1', 1, CanaleEnum.Meta, 'venduto'),
    lead('l2', 2, CanaleEnum.Meta, 'perso'),
    lead('l3', 1, CanaleEnum.Google, 'venduto'),
    lead('l4', 1, CanaleEnum.Google, 'perso'),
    lead('l5', 2, CanaleEnum.Google, 'perso'),
    lead('l6', 2, CanaleEnum.Google, 'perso'),
  ],
  vendite: [
    { id: 'v1', data_vendita: day, negozio_id: 1, lead_id: 'l1', importo_totale: 10000, modello_cucina: 'A', giorni_dalla_lead: 5, margine_percentuale: 0.3 },
    { id: 'v2', data_vendita: day, negozio_id: 1, lead_id: 'l3', importo_totale: 12000, modello_cucina: 'A', giorni_dalla_lead: 5, margine_percentuale: 0.3 },
  ],
};

describe('calculateStoreCac', () => {
  const { rows, averageCac, unattributedSpend } = calculateStoreCac(base);
  const byId = (id: number) => rows.find(r => r.id === id)!;

  it('splits each channel spend across stores by that channel lead share', () => {
    // Meta: 1000 su 2 lead → 500 a testa. Google: 3000 su 4 lead → 750 a lead.
    expect(byId(1).spesaAttribuita).toBe(500 + 1500); // 1 lead Meta + 2 lead Google
    expect(byId(2).spesaAttribuita).toBe(500 + 1500);
    expect(byId(3).spesaAttribuita).toBe(0);
  });

  it('attributes all spend when every channel has leads', () => {
    const total = rows.reduce((s, r) => s + r.spesaAttribuita, 0);
    expect(total).toBe(4000);
    expect(unattributedSpend).toBe(0);
  });

  it('computes CAC per store and leaves it undefined without sales', () => {
    expect(byId(1).cac).toBe(1000); // 2000 / 2 vendite
    expect(byId(2).cac).toBeNull();
    expect(byId(3).cac).toBeNull();
  });

  it('computes the overall CAC on the same basis', () => {
    expect(averageCac).toBe(2000); // 4000 / 2 vendite
  });

  it('sorts best CAC first and stores without sales last', () => {
    expect(rows[0].id).toBe(1);
    expect(rows.slice(1).every(r => r.cac === null)).toBe(true);
  });

  it('reports spend of a channel with no leads as unattributed', () => {
    const r = calculateStoreCac({ ...base, leads: base.leads.filter(l => l.canale_provenienza !== CanaleEnum.Google) });
    expect(r.unattributedSpend).toBe(3000);
  });

  it('returns a null average CAC with no sales', () => {
    const r = calculateStoreCac({ ...base, leads: [], vendite: [] });
    expect(r.averageCac).toBeNull();
  });
});
