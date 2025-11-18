import { subDays, eachDayOfInterval } from 'date-fns';
import { CanaleEnum } from '../types';

const today = new Date();
const dateRange = eachDayOfInterval({ start: subDays(today, 365), end: today });

const generateInsights = (baseSpend: number) => {
    return dateRange.map(date => {
        const spend = baseSpend * (0.8 + Math.random() * 0.4);
        const impressions = spend * (150 + Math.random() * 100);
        const clicks = impressions * (0.01 + Math.random() * 0.02);
        const leads = clicks * (0.05 + Math.random() * 0.1);
        const conversions = leads * (0.1 + Math.random() * 0.2);
        const revenue = conversions * (8000 + Math.random() * 4000);
        return {
            date,
            spend,
            impressions,
            clicks,
            leads: Math.floor(leads),
            conversions: Math.floor(conversions),
            revenue,
            reach: impressions * (0.7 + Math.random() * 0.2),
            engagements: clicks * (1.5 + Math.random()),
            form_leads: Math.floor(leads * (0.8 + Math.random() * 0.2)),
            viewable_impressions: impressions * (0.6 + Math.random() * 0.2),
        };
    });
};

export const mockCampaigns = [
  // Meta
  { id: 1, channel: CanaleEnum.Meta, name: 'Meta Lead Gen - Lombardia', status: 'active', daily_budget: 200, insights: generateInsights(200) },
  { id: 2, channel: CanaleEnum.Meta, name: 'Meta Conversioni - Roma', status: 'active', daily_budget: 350, insights: generateInsights(350) },
  { id: 3, channel: CanaleEnum.Meta, name: 'Meta Retargeting - Top Cities', status: 'paused', daily_budget: 150, insights: generateInsights(50) },
  
  // Google
  { id: 4, channel: CanaleEnum.Google, name: 'Google Search - Cucine Moderne', status: 'active', type: 'Search', quality_score: 8, impression_share: 75.4, insights: generateInsights(400) },
  { id: 5, channel: CanaleEnum.Google, name: 'Google Shopping - Elettrodomestici', status: 'active', type: 'Shopping', quality_score: null, impression_share: 88.1, insights: generateInsights(300) },
  { id: 6, channel: CanaleEnum.Google, name: 'Google Display - Brand Awareness', status: 'paused', type: 'Display', quality_score: null, impression_share: null, insights: generateInsights(80) },
  { id: 7, channel: CanaleEnum.Google, name: 'Google PMax - Full Funnel', status: 'active', type: 'Performance Max', quality_score: null, impression_share: 92.3, insights: generateInsights(500) },

  // Programmatic
  { id: 8, channel: CanaleEnum.Programmatic, name: 'Programmatic Video - Pre-Roll', status: 'active', insights: generateInsights(250) },
  { id: 9, channel: CanaleEnum.Programmatic, name: 'Programmatic Display - Prospecting', status: 'active', insights: generateInsights(180) },
];

export const mockKeywords = [
    { id: 1, keyword: 'cucine su misura milano', match_type: 'Exact', insights: generateInsights(50) },
    { id: 2, keyword: 'offerta cucine complete', match_type: 'Broad', insights: generateInsights(80) },
    { id: 3, keyword: 'cucine design moderno', match_type: 'Phrase', insights: generateInsights(65) },
    { id: 4, keyword: 'miglior prezzo cucina', match_type: 'Broad', insights: generateInsights(70) },
    { id: 5, keyword: 'arredamento cucina roma', match_type: 'Exact', insights: generateInsights(45) },
    { id: 6, keyword: 'cucine Lube', match_type: 'Broad', insights: generateInsights(90) },
    { id: 7, keyword: 'cucine Scavolini', match_type: 'Phrase', insights: generateInsights(85) },
    { id: 8, keyword: 'outlet cucine', match_type: 'Exact', insights: generateInsights(60) },
    { id: 9, keyword: 'progettazione cucina online', match_type: 'Phrase', insights: generateInsights(40) },
    { id: 10, keyword: 'preventivo cucina', match_type: 'Exact', insights: generateInsights(55) },
    ...Array.from({length: 20}, (_, i) => ({id: 11+i, keyword: `generic keyword ${i}`, match_type: 'Broad', insights: generateInsights(20 + Math.random()*20)}))
];

export const mockDemographics = {
    byAge: [
        { age: '18-24', leads: 150 },
        { age: '25-34', leads: 850 },
        { age: '35-44', leads: 1200 },
        { age: '45-54', leads: 950 },
        { age: '55+', leads: 400 },
    ],
    byGender: [
        { gender: 'Donna', leads: 2250 },
        { gender: 'Uomo', leads: 1300 },
    ]
};

export const mockPublishers = [
    { id: 1, name: 'Corriere.it', insights: generateInsights(40) },
    { id: 2, name: 'Repubblica.it', insights: generateInsights(38) },
    { id: 3, name: 'Gazzetta.it', insights: generateInsights(35) },
    { id: 4, name: 'IlSole24Ore.com', insights: generateInsights(30) },
    { id: 5, name: 'GialloZafferano.it', insights: generateInsights(55) },
    { id: 6, name: 'Subito.it', insights: generateInsights(42) },
    { id: 7, name: 'YouTube', insights: generateInsights(80) },
    { id: 8, name: 'Mediaset Infinity', insights: generateInsights(65) },
    ...Array.from({length: 12}, (_, i) => ({id: 9+i, name: `Publisher ${i}`, insights: generateInsights(10 + Math.random()*15)}))
];
