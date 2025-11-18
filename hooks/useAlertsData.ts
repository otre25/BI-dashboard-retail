import { useMemo } from 'react';
import { subDays, isWithinInterval, startOfDay } from 'date-fns';
import { mockCampaigns } from '../lib/advertisingMockData';
import { appointments, salesReps } from '../lib/salesMockData';

export interface Alert {
    id: string;
    title: string;
    description: string;
    priority: 'critical' | 'warning' | 'info';
    timestamp: string;
}

export const useAlertsData = (): Alert[] => {
    const alerts = useMemo(() => {
        const generatedAlerts: Alert[] = [];
        const today = new Date();
        
        // 1. ROAS Critico
        const roasCriticalCampaigns: string[] = [];
        mockCampaigns.forEach(campaign => {
            let consecutiveDays = 0;
            for (let i = 1; i <= 5; i++) { // Check last 5 days
                const date = subDays(today, i);
                const insight = campaign.insights.find(ins => 
                    startOfDay(ins.date).getTime() === startOfDay(date).getTime()
                );
                if (insight) {
                    const roas = insight.spend > 0 ? insight.revenue / insight.spend : 0;
                    if (roas < 2.0 && roas > 0) { // ROAS is low
                        consecutiveDays++;
                    } else {
                        consecutiveDays = 0; // Reset counter
                    }
                }
                if (consecutiveDays >= 3) {
                    roasCriticalCampaigns.push(campaign.name);
                    break; 
                }
            }
        });
        if(roasCriticalCampaigns.length > 0) {
            generatedAlerts.push({
                id: 'roas_critical',
                title: 'ROAS Critico Rilevato',
                description: `Le campagne "${roasCriticalCampaigns.join(', ')}" hanno un ROAS inferiore a 2.0x per più di 3 giorni. Considera di metterle in pausa.`,
                priority: 'critical',
                timestamp: today.toISOString(),
            });
        }
        
        // 2. Venditore Inattivo
        const sevenDaysAgo = subDays(today, 7);
        const activeRepsLast7Days = new Set(
            appointments
                .filter(a => isWithinInterval(a.data, { start: sevenDaysAgo, end: today }))
                .map(a => a.venditore_id)
        );
        const inactiveReps = salesReps.filter(rep => !activeRepsLast7Days.has(rep.id));

        if(inactiveReps.length > 0) {
            generatedAlerts.push({
                id: 'inactive_reps',
                title: 'Venditori Inattivi',
                description: `I seguenti venditori non hanno fissato appuntamenti negli ultimi 7 giorni: ${inactiveReps.map(r => r.nome).join(', ')}.`,
                priority: 'warning',
                timestamp: subDays(today,1).toISOString(),
            });
        }
        
        // 3. Lead Non Seguiti (Mocked)
        generatedAlerts.push({
            id: 'unfollowed_leads',
            title: 'Lead da Contattare',
            description: 'Ci sono 8 lead generati da più di 48 ore che non sono ancora stati contattati.',
            priority: 'warning',
            timestamp: subDays(today,2).toISOString(),
        });

        // 4. Info Alert (Example)
         generatedAlerts.push({
            id: 'info_report_ready',
            title: 'Report Settimanale Pronto',
            description: 'Il riepilogo delle performance della scorsa settimana è disponibile nel Report Generator.',
            priority: 'info',
            timestamp: subDays(today, 3).toISOString(),
        });


        return generatedAlerts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    }, []);

    return alerts;
};
