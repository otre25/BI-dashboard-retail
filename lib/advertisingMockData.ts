import { CanaleEnum } from '../types';
import { createRng, DEMO_SEED, leadData, spesaData, venditaData } from './mockData';

// Campagne, keyword e publisher sono una RIPARTIZIONE dei totali di canale del dataset
// centrale (lib/mockData): sommando le campagne di un canale si ottengono esattamente
// spesa, click, lead e fatturato che la dashboard mostra per quel canale.

interface InsightRow {
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  revenue: number;
  reach: number;
  engagements: number;
  form_leads: number;
  viewable_impressions: number;
}

interface ChannelDay {
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  leadCount: number;
  saleAmounts: number[];
}

interface Slice {
  /** quota della spesa */
  weight: number;
  /** resa: sposta lead e vendite verso i figli migliori senza cambiare i totali */
  quality: number;
  /** se presente, il figlio non ha dati dopo questa data (es. campagna messa in pausa) */
  endsBefore?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PAUSED_FOR_DAYS = 45;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const buildChannelDays = (canale: CanaleEnum): ChannelDay[] => {
  const days = new Map<string, ChannelDay>();
  spesaData
    .filter(s => s.canale === canale)
    .forEach(s => {
      days.set(dayKey(s.data), { date: s.data, spend: s.spesa, impressions: s.impression, clicks: s.click, leadCount: 0, saleAmounts: [] });
    });
  const leadChannel = new Map<string, CanaleEnum>();
  leadData.forEach(l => {
    leadChannel.set(l.id, l.canale_provenienza);
    if (l.canale_provenienza === canale) {
      const day = days.get(dayKey(l.data_generazione));
      if (day) day.leadCount += 1;
    }
  });
  venditaData.forEach(v => {
    if (!v.lead_id || leadChannel.get(v.lead_id) !== canale) return;
    const day = days.get(dayKey(v.data_vendita));
    if (day) day.saleAmounts.push(v.importo_totale);
  });
  return Array.from(days.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
};

const pickIndex = (rng: () => number, weights: number[]): number => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
};

/** Divide i giorni di un canale tra i figli: gli interi (lead, vendite, click, impression) restano interi e sommano esattamente. */
const splitDays = (days: ChannelDay[], slices: Slice[], rng: () => number): InsightRow[][] => {
  const result: InsightRow[][] = slices.map(() => []);
  days.forEach(day => {
    const live = slices.map((s, i) => ({ s, i })).filter(({ s }) => !s.endsBefore || day.date < s.endsBefore);
    const totalWeight = live.reduce((sum, { s }) => sum + s.weight, 0);
    const rows = live.map(() => ({ impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 }));
    const eventWeights = live.map(({ s }) => s.weight * s.quality);

    let usedImpressions = 0;
    let usedClicks = 0;
    live.forEach(({ s }, k) => {
      const isLast = k === live.length - 1;
      rows[k].impressions = isLast ? day.impressions - usedImpressions : Math.floor((day.impressions * s.weight) / totalWeight);
      rows[k].clicks = isLast ? day.clicks - usedClicks : Math.floor((day.clicks * s.weight) / totalWeight);
      usedImpressions += rows[k].impressions;
      usedClicks += rows[k].clicks;
    });
    for (let n = 0; n < day.leadCount; n++) rows[pickIndex(rng, eventWeights)].leads += 1;
    day.saleAmounts.forEach(amount => {
      const k = pickIndex(rng, eventWeights);
      rows[k].conversions += 1;
      rows[k].revenue += amount;
    });

    live.forEach(({ s, i }, k) => {
      const row = rows[k];
      result[i].push({
        date: day.date,
        spend: (day.spend * s.weight) / totalWeight,
        impressions: row.impressions,
        clicks: row.clicks,
        leads: row.leads,
        conversions: row.conversions,
        revenue: row.revenue,
        reach: Math.floor(row.impressions * (0.72 + rng() * 0.1)),
        engagements: Math.floor(row.clicks * (1.5 + rng())),
        form_leads: Math.floor(row.leads * (0.85 + rng() * 0.15)),
        viewable_impressions: Math.floor(row.impressions * (0.62 + rng() * 0.15)),
      });
    });
  });
  return result;
};

const rng = createRng(DEMO_SEED + 1);
const today = new Date();
const pausedFrom = new Date(today.getTime() - PAUSED_FOR_DAYS * DAY_MS);

interface CampaignDef {
  id: number;
  channel: CanaleEnum;
  name: string;
  status: 'active' | 'paused';
  daily_budget: number;
  type: string;
  quality_score: number | null;
  impression_share: number | null;
  weight: number;
  quality: number;
}

const campaignDefs: CampaignDef[] = [
  { id: 1, channel: CanaleEnum.Meta, name: 'Meta Lead Gen - Lombardia', status: 'active', daily_budget: 330, type: 'Lead Gen', quality_score: null, impression_share: null, weight: 0.45, quality: 1.0 },
  { id: 2, channel: CanaleEnum.Meta, name: 'Meta Conversioni - Roma', status: 'active', daily_budget: 290, type: 'Conversioni', quality_score: null, impression_share: null, weight: 0.4, quality: 1.3 },
  { id: 3, channel: CanaleEnum.Meta, name: 'Meta Retargeting - Top Cities', status: 'paused', daily_budget: 140, type: 'Retargeting', quality_score: null, impression_share: null, weight: 0.15, quality: 1.6 },

  { id: 4, channel: CanaleEnum.Google, name: 'Google Search - Cucine Moderne', status: 'active', daily_budget: 380, type: 'Search', quality_score: 8, impression_share: 75.4, weight: 0.3, quality: 1.3 },
  { id: 5, channel: CanaleEnum.Google, name: 'Google Shopping - Elettrodomestici', status: 'active', daily_budget: 210, type: 'Shopping', quality_score: null, impression_share: 88.1, weight: 0.17, quality: 0.5 },
  { id: 6, channel: CanaleEnum.Google, name: 'Google Display - Brand Awareness', status: 'paused', daily_budget: 80, type: 'Display', quality_score: null, impression_share: null, weight: 0.06, quality: 0.4 },
  { id: 7, channel: CanaleEnum.Google, name: 'Google PMax - Full Funnel', status: 'active', daily_budget: 580, type: 'Performance Max', quality_score: null, impression_share: 92.3, weight: 0.47, quality: 1.1 },

  { id: 8, channel: CanaleEnum.Programmatic, name: 'Programmatic Video - Pre-Roll', status: 'active', daily_budget: 250, type: 'Video', quality_score: null, impression_share: null, weight: 0.55, quality: 0.9 },
  { id: 9, channel: CanaleEnum.Programmatic, name: 'Programmatic Display - Prospecting', status: 'active', daily_budget: 200, type: 'Display', quality_score: null, impression_share: null, weight: 0.45, quality: 1.1 },
];

const channelDays = {
  [CanaleEnum.Meta]: buildChannelDays(CanaleEnum.Meta),
  [CanaleEnum.Google]: buildChannelDays(CanaleEnum.Google),
  [CanaleEnum.Programmatic]: buildChannelDays(CanaleEnum.Programmatic),
};

const insightsByCampaign = new Map<number, InsightRow[]>();
(Object.keys(channelDays) as CanaleEnum[]).forEach(channel => {
  const defs = campaignDefs.filter(c => c.channel === channel);
  const slices: Slice[] = defs.map(d => ({ weight: d.weight, quality: d.quality, endsBefore: d.status === 'paused' ? pausedFrom : undefined }));
  const rows = splitDays(channelDays[channel], slices, rng);
  defs.forEach((d, i) => insightsByCampaign.set(d.id, rows[i]));
});

export const mockCampaigns = campaignDefs.map(({ weight: _w, quality: _q, ...c }) => ({
  ...c,
  insights: insightsByCampaign.get(c.id) ?? [],
}));

// Le keyword si spartiscono i giorni della campagna Search; non aggiungono spesa a quella dei canali.
const KEYWORDS: { keyword: string; match_type: string; weight: number; quality: number }[] = [
  { keyword: 'cucine su misura milano', match_type: 'Exact', weight: 50, quality: 1.5 },
  { keyword: 'offerta cucine complete', match_type: 'Broad', weight: 80, quality: 0.8 },
  { keyword: 'cucine design moderno', match_type: 'Phrase', weight: 65, quality: 1.1 },
  { keyword: 'miglior prezzo cucina', match_type: 'Broad', weight: 70, quality: 0.7 },
  { keyword: 'arredamento cucina roma', match_type: 'Exact', weight: 45, quality: 1.4 },
  { keyword: 'cucine Lube', match_type: 'Broad', weight: 90, quality: 0.9 },
  { keyword: 'cucine Scavolini', match_type: 'Phrase', weight: 85, quality: 0.9 },
  { keyword: 'outlet cucine', match_type: 'Exact', weight: 60, quality: 0.6 },
  { keyword: 'progettazione cucina online', match_type: 'Phrase', weight: 40, quality: 1.2 },
  { keyword: 'preventivo cucina', match_type: 'Exact', weight: 55, quality: 1.7 },
  ...Array.from({ length: 20 }, (_, i) => ({ keyword: `generic keyword ${i}`, match_type: 'Broad', weight: 20 + (i % 5) * 4, quality: 0.5 })),
];

const searchRows = insightsByCampaign.get(4) ?? [];
const searchDays: ChannelDay[] = searchRows.map(r => ({
  date: r.date, spend: r.spend, impressions: r.impressions, clicks: r.clicks, leadCount: r.leads, saleAmounts: [],
}));
// Le vendite della campagna Search vanno alle keyword: si ricostruiscono dai suoi conteggi e ricavi medi.
searchRows.forEach((r, idx) => {
  if (r.conversions === 0) return;
  const each = r.revenue / r.conversions;
  searchDays[idx].saleAmounts = Array.from({ length: r.conversions }, () => each);
});
const keywordRows = splitDays(searchDays, KEYWORDS.map(k => ({ weight: k.weight, quality: k.quality })), rng);

export const mockKeywords = KEYWORDS.map((k, i) => ({
  id: i + 1,
  keyword: k.keyword,
  match_type: k.match_type,
  insights: keywordRows[i],
}));

export const mockDemographics = (() => {
  const metaLeads = campaignDefs
    .filter(c => c.channel === CanaleEnum.Meta)
    .reduce((sum, c) => sum + (insightsByCampaign.get(c.id) ?? []).reduce((s, r) => s + r.leads, 0), 0);
  const split = (shares: number[]) => {
    const raw = shares.map(s => Math.floor(metaLeads * s));
    raw[raw.indexOf(Math.max(...raw))] += metaLeads - raw.reduce((a, b) => a + b, 0);
    return raw;
  };
  const ages = split([0.04, 0.24, 0.34, 0.27, 0.11]);
  const genders = split([0.64, 0.36]);
  return {
    byAge: ['18-24', '25-34', '35-44', '45-54', '55+'].map((age, i) => ({ age, leads: ages[i] })),
    byGender: ['Donna', 'Uomo'].map((gender, i) => ({ gender, leads: genders[i] })),
  };
})();

// I publisher si spartiscono l'intero canale Programmatic.
const PUBLISHERS: { name: string; weight: number; quality: number }[] = [
  { name: 'Corriere.it', weight: 40, quality: 1.2 },
  { name: 'Repubblica.it', weight: 38, quality: 1.1 },
  { name: 'Gazzetta.it', weight: 35, quality: 0.6 },
  { name: 'IlSole24Ore.com', weight: 30, quality: 1.4 },
  { name: 'GialloZafferano.it', weight: 55, quality: 0.8 },
  { name: 'Subito.it', weight: 42, quality: 1.3 },
  { name: 'YouTube', weight: 80, quality: 0.9 },
  { name: 'Mediaset Infinity', weight: 65, quality: 0.7 },
  ...Array.from({ length: 12 }, (_, i) => ({ name: `Publisher ${i}`, weight: 10 + (i % 4) * 4, quality: 0.5 })),
];
const publisherRows = splitDays(channelDays[CanaleEnum.Programmatic], PUBLISHERS.map(p => ({ weight: p.weight, quality: p.quality })), rng);

export const mockPublishers = PUBLISHERS.map((p, i) => ({ id: i + 1, name: p.name, insights: publisherRows[i] }));
