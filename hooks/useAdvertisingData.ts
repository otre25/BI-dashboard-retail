import { useMemo } from 'react';
import { isWithinInterval, format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { mockCampaigns, mockKeywords, mockDemographics, mockPublishers } from '../lib/advertisingMockData';
import { CanaleEnum } from '../types';

// Type definitions
export interface OverviewTableRow {
  canale: string;
  spesa: number;
  impression: number;
  click: number;
  ctr: number;
  cpc: number;
  lead: number;
  cpl: number;
  conversioni: number;
  roas: number;
  fatturato: number;
}
export interface OverviewData {
    tableData: OverviewTableRow[];
    dailySpend: any[];
    budgetDistribution: any[];
    roasTrend: any[];
}
export interface MetaCampaign { name: string; status: 'active' | 'paused'; daily_budget: number; spend: number; results: number; cost_per_result: number; roas: number; }
export interface MetaData { kpis: any; campaigns: MetaCampaign[]; demographics: any;}
export interface GoogleCampaign { name: string; type: string; status: 'active' | 'paused'; spend: number; quality_score: number; impression_share: number; conversions: number; cost_per_conversion: number; roas: number; }
export interface GoogleKeyword { keyword: string; match_type: string; impressions: number; clicks: number; ctr: number; avg_cpc: number; conversions: number; cost_per_conversion: number; }
export interface GoogleData { kpis: any; campaigns: GoogleCampaign[]; keywords: GoogleKeyword[]; }
export interface ProgrammaticPublisher { name: string; impressions: number; viewability: number; clicks: number; ctr: number; spend: number; conversions: number; roas: number; }
export interface ProgrammaticData { kpis: any; publishers: ProgrammaticPublisher[]; }


const useFilteredAdvData = (startDate: Date, endDate: Date) => {
    return useMemo(() => {
        const interval = { start: startDate, end: endDate };
        const filterByDate = (item: { date: Date }) => isWithinInterval(item.date, interval);

        return {
            campaigns: mockCampaigns.filter(c => c.insights.some(filterByDate)),
            keywords: mockKeywords.filter(k => k.insights.some(filterByDate)),
            publishers: mockPublishers.filter(p => p.insights.some(filterByDate)),
        };
    }, [startDate, endDate]);
};

export const useAdvertisingData = (startDate: Date, endDate: Date) => {
    const currentData = useFilteredAdvData(startDate, endDate);
    
    // Helper to aggregate insights
    const aggregateInsights = (items: any[]) => {
        const interval = { start: startDate, end: endDate };
        return items.reduce((acc, item) => {
            const relevantInsights = item.insights.filter((i: any) => isWithinInterval(i.date, interval));
            relevantInsights.forEach((insight: any) => {
                Object.keys(insight).forEach(key => {
                    if (key !== 'date') {
                        acc[key] = (acc[key] || 0) + insight[key];
                    }
                });
            });
            return acc;
        }, {});
    };

    const overview = useMemo(() => {
        const channels = [CanaleEnum.Meta, CanaleEnum.Google, CanaleEnum.Programmatic];
        const tableData = channels.map(channel => {
            const channelCampaigns = currentData.campaigns.filter(c => c.channel === channel);
            const insights = aggregateInsights(channelCampaigns);
            
            const { spend = 0, impressions = 0, clicks = 0, leads = 0, conversions = 0, revenue = 0 } = insights as any;

            return {
                canale: channel.charAt(0).toUpperCase() + channel.slice(1),
                spesa: spend,
                impression: impressions,
                click: clicks,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                cpc: clicks > 0 ? spend / clicks : 0,
                lead: leads,
                cpl: leads > 0 ? spend / leads : 0,
                conversioni: conversions,
                roas: spend > 0 ? revenue / spend : 0,
                fatturato: revenue,
            };
        });

        const dailySpendData = new Map<string, any>();
        mockCampaigns.forEach(c => {
             c.insights.forEach(i => {
                const dateKey = format(i.date, 'MMM d');
                const entry = dailySpendData.get(dateKey) || { date: dateKey };
                const channelName = c.channel.charAt(0).toUpperCase() + c.channel.slice(1);
                entry[channelName] = (entry[channelName] || 0) + i.spend;
                dailySpendData.set(dateKey, entry);
             });
        });
        
        const budgetDistribution = tableData.map(d => ({ name: d.canale, value: d.spesa }));
        
        // Simplified ROAS trend
        const roasTrendData = new Map<string, any>();
         mockCampaigns.forEach(c => {
             c.insights.forEach(i => {
                const dateKey = format(i.date, 'MMM d');
                const entry = roasTrendData.get(dateKey) || { date: dateKey };
                const channelName = c.channel.charAt(0).toUpperCase() + c.channel.slice(1);
                 entry[channelName] = entry[channelName] ? (entry[channelName] + (i.revenue / i.spend)) / 2 : (i.revenue / i.spend);
                roasTrendData.set(dateKey, entry);
             });
        });

        return {
            tableData,
            dailySpend: Array.from(dailySpendData.values()).slice(-30),
            budgetDistribution,
            roasTrend: Array.from(roasTrendData.values()).slice(-90),
        };

    }, [currentData, startDate, endDate]);

    const meta = useMemo(() => {
        const metaCampaigns = currentData.campaigns.filter(c => c.channel === CanaleEnum.Meta);
        const campaigns = metaCampaigns.map(c => {
            const insights = aggregateInsights([c]);
            const { spend = 0, leads = 0, revenue = 0 } = insights as any;
            return {
                name: c.name,
                status: c.status,
                daily_budget: c.daily_budget,
                spend,
                results: leads,
                cost_per_result: leads > 0 ? spend / leads : 0,
                roas: spend > 0 ? revenue / spend : 0,
            };
        });
        const totalInsights = aggregateInsights(metaCampaigns) as any;
        const kpis = {
            reach: totalInsights.reach || 0,
            frequency: totalInsights.impressions > 0 ? totalInsights.impressions / (totalInsights.reach || 1) : 0,
            engagementRate: totalInsights.impressions > 0 ? (totalInsights.engagements / totalInsights.impressions) * 100 : 0,
            costPerLeadForm: totalInsights.form_leads > 0 ? totalInsights.spend / totalInsights.form_leads : 0,
        };

        return { kpis, campaigns, demographics: mockDemographics };
    }, [currentData]);
    
    const google = useMemo(() => {
        const googleCampaigns = currentData.campaigns.filter(c => c.channel === CanaleEnum.Google);
        const campaigns = googleCampaigns.map(c => {
            const insights = aggregateInsights([c]);
            const { spend = 0, conversions = 0, revenue = 0 } = insights as any;
            return {
                name: c.name,
                type: c.type,
                status: c.status,
                spend,
                quality_score: c.quality_score,
                impression_share: c.impression_share,
                conversions,
                cost_per_conversion: conversions > 0 ? spend / conversions : 0,
                roas: spend > 0 ? revenue / spend : 0,
            };
        });
        const keywords = currentData.keywords.map(k => {
             const insights = aggregateInsights([k]) as any;
             return {
                ...k,
                clicks: insights.clicks || 0,
                impressions: insights.impressions || 0,
                ctr: insights.impressions > 0 ? (insights.clicks / insights.impressions) * 100 : 0,
                avg_cpc: insights.clicks > 0 ? insights.spend / insights.clicks : 0,
                conversions: insights.conversions || 0,
                cost_per_conversion: insights.conversions > 0 ? insights.spend / insights.conversions : 0,
             }
        }).sort((a,b) => b.conversions - a.conversions).slice(0, 20);

        const totalQS = campaigns.reduce((sum, c) => sum + (c.quality_score || 0), 0);
        const totalIS = campaigns.reduce((sum, c) => sum + (c.impression_share || 0), 0);

        const kpis = {
            avgQualityScore: totalQS / (campaigns.filter(c => c.quality_score).length || 1),
            impressionShare: totalIS / (campaigns.filter(c => c.impression_share).length || 1),
            searchLostISBudget: 22.5, // Mock value
            searchLostISRank: 15.2, // Mock value
        };

        return { kpis, campaigns, keywords };
    }, [currentData]);

    const programmatic = useMemo(() => {
        const publishers = currentData.publishers.map(p => {
             const insights = aggregateInsights([p]) as any;
             return {
                name: p.name,
                impressions: insights.impressions || 0,
                viewability: insights.impressions > 0 ? (insights.viewable_impressions / insights.impressions) * 100 : 0,
                clicks: insights.clicks || 0,
                ctr: insights.impressions > 0 ? (insights.clicks / insights.impressions) * 100 : 0,
                spend: insights.spend || 0,
                conversions: insights.conversions || 0,
                roas: insights.spend > 0 ? insights.revenue / insights.spend : 0,
             }
        }).sort((a,b) => b.roas - a.roas);

        const totalInsights = aggregateInsights(currentData.publishers) as any;
        const kpis = {
            viewability: totalInsights.impressions > 0 ? (totalInsights.viewable_impressions / totalInsights.impressions) * 100 : 0,
            cpm: totalInsights.impressions > 0 ? (totalInsights.spend / totalInsights.impressions) * 1000 : 0,
            videoCompletionRate: 75.4, // Mock value
            brandSafetyScore: 98.2, // Mock value
        };
        
        return { kpis, publishers };
    }, [currentData]);


    return {
        data: { overview, meta, google, programmatic },
        isLoading: false,
    };
};