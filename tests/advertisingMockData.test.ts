import { describe, expect, it } from 'vitest';
import { leadData, spesaData, venditaData } from '../lib/mockData';
import { mockCampaigns, mockKeywords, mockPublishers, mockDemographics } from '../lib/advertisingMockData';
import { CanaleEnum } from '../types';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const channelRows = (canale: CanaleEnum) => mockCampaigns.filter(c => c.channel === canale).flatMap(c => c.insights);

describe('advertising mock data', () => {
  (Object.values(CanaleEnum) as CanaleEnum[]).forEach(canale => {
    it(`campaigns of ${canale} add up to the core channel totals`, () => {
      const rows = channelRows(canale);
      const coreSpend = sum(spesaData.filter(s => s.canale === canale).map(s => s.spesa));
      const coreClicks = sum(spesaData.filter(s => s.canale === canale).map(s => s.click));
      const leadIds = new Set(leadData.filter(l => l.canale_provenienza === canale).map(l => l.id));
      const coreSales = venditaData.filter(v => v.lead_id && leadIds.has(v.lead_id));
      expect(sum(rows.map(r => r.spend))).toBeCloseTo(coreSpend, 1);
      expect(sum(rows.map(r => r.clicks))).toBe(coreClicks);
      expect(sum(rows.map(r => r.leads))).toBe(leadIds.size);
      expect(sum(rows.map(r => r.conversions))).toBe(coreSales.length);
      expect(sum(rows.map(r => r.revenue))).toBeCloseTo(sum(coreSales.map(v => v.importo_totale)), 1);
    });
  });

  it('keywords split exactly the Search campaign', () => {
    const search = mockCampaigns.find(c => c.id === 4)!.insights;
    const kw = mockKeywords.flatMap(k => k.insights);
    expect(sum(kw.map(r => r.clicks))).toBe(sum(search.map(r => r.clicks)));
    expect(sum(kw.map(r => r.conversions))).toBe(sum(search.map(r => r.conversions)));
    expect(sum(kw.map(r => r.spend))).toBeCloseTo(sum(search.map(r => r.spend)), 1);
  });

  it('publishers split exactly the Programmatic channel', () => {
    const pub = mockPublishers.flatMap(p => p.insights);
    const prog = channelRows(CanaleEnum.Programmatic);
    expect(sum(pub.map(r => r.spend))).toBeCloseTo(sum(prog.map(r => r.spend)), 1);
    expect(sum(pub.map(r => r.conversions))).toBe(sum(prog.map(r => r.conversions)));
  });

  it('stops paused campaigns recently and keeps them out of the latest data', () => {
    const paused = mockCampaigns.filter(c => c.status === 'paused');
    expect(paused.length).toBeGreaterThan(0);
    const cutoff = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    paused.forEach(c => expect(c.insights.every(r => r.date < cutoff)).toBe(true));
  });

  it('demographics add up to the Meta leads', () => {
    const metaLeads = sum(channelRows(CanaleEnum.Meta).map(r => r.leads));
    expect(sum(mockDemographics.byAge.map(a => a.leads))).toBe(metaLeads);
    expect(sum(mockDemographics.byGender.map(g => g.leads))).toBe(metaLeads);
  });
});
