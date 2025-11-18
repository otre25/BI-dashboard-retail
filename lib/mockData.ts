import { addDays, subDays } from 'date-fns';
import type { Negozio, SpesaAdvertising, Lead, Vendita } from '../types';
import { CanaleEnum } from '../types';

export const negozi: Negozio[] = [
  { id: 1, nome: "Cucine Milano Centro", citta: "Milano", metri_quadri: 250 },
  { id: 2, nome: "Cucine Roma Termini", citta: "Roma", metri_quadri: 300 },
  { id: 3, nome: "Cucine Napoli Vomero", citta: "Napoli", metri_quadri: 200 },
  { id: 4, nome: "Cucine Torino Re Umberto", citta: "Torino", metri_quadri: 220 },
  { id: 5, nome: "Cucine Firenze SMN", citta: "Firenze", metri_quadri: 180 },
  { id: 6, nome: "Cucine Bologna Fiera", citta: "Bologna", metri_quadri: 210 },
  { id: 7, nome: "Cucine Palermo Politeama", citta: "Palermo", metri_quadri: 190 },
  { id: 8, nome: "Cucine Genova Brignole", citta: "Genova", metri_quadri: 170 },
  { id: 9, nome: "Cucine Bari Murattiano", citta: "Bari", metri_quadri: 230 },
  { id: 10, nome: "Cucine Catania Etnea", citta: "Catania", metri_quadri: 200 },
  { id: 11, nome: "Cucine Verona Arena", citta: "Verona", metri_quadri: 160 },
  { id: 12, nome: "Cucine Venezia Mestre", citta: "Venezia", metri_quadri: 150 },
  { id: 13, nome: "Cucine Padova Prato", citta: "Padova", metri_quadri: 180 },
  { id: 14, nome: "Cucine Parma Centro", citta: "Parma", metri_quadri: 140 },
  { id: 15, nome: "Cucine Brescia Castello", citta: "Brescia", metri_quadri: 175 },
];

const generateRandomData = () => {
  const today = new Date();
  const spesaData: SpesaAdvertising[] = [];
  const leadData: Lead[] = [];
  const venditaData: Vendita[] = [];

  for (let i = 0; i < 365; i++) { // Generate more data for yearly view
    const date = subDays(today, i);
    
    // Spesa
    const metaSpesa = Math.random() * 500 + 100;
    spesaData.push({
      id: `meta-${i}`, data: date, canale: CanaleEnum.Meta, spesa: metaSpesa,
      impression: Math.floor(metaSpesa * (100 + Math.random() * 20)), click: Math.floor(metaSpesa * (1.5 + Math.random()))
    });
    const googleSpesa = Math.random() * 800 + 200;
    spesaData.push({
      id: `google-${i}`, data: date, canale: CanaleEnum.Google, spesa: googleSpesa,
      impression: Math.floor(googleSpesa * (80 + Math.random() * 15)), click: Math.floor(googleSpesa * (2.5 + Math.random()))
    });
    const programmaticSpesa = Math.random() * 300 + 50;
    spesaData.push({
      id: `prog-${i}`, data: date, canale: CanaleEnum.Programmatic, spesa: programmaticSpesa,
      impression: Math.floor(programmaticSpesa * (200 + Math.random() * 50)), click: Math.floor(programmaticSpesa * (0.8 + Math.random() * 0.5))
    });

    // Leads & Vendite Funnel
    const dailyLeads = Math.floor((metaSpesa + googleSpesa) / 45) + Math.floor(Math.random() * 5);
    for (let j = 0; j < dailyLeads; j++) {
      const leadId = `lead-${i}-${j}`;
      const canale = Math.random() > 0.4 ? CanaleEnum.Google : CanaleEnum.Meta;
      const lead: Lead = {
        id: leadId,
        data_generazione: date,
        canale_provenienza: canale,
        negozio_assegnato_id: negozi[Math.floor(Math.random() * negozi.length)].id,
        stato: 'nuovo'
      };

      if (Math.random() < 0.70) { // 70% to appuntamento_fissato
        lead.stato = 'appuntamento_fissato';
        if (Math.random() < 0.85) { // 85% of those show up
            lead.stato = 'appuntamento_presentato';
            if (Math.random() < 0.35) { // 35% of presented convert to sale
                lead.stato = 'venduto';
                const giorni_dalla_lead = Math.floor(Math.random() * 25) + 5;
                venditaData.push({
                  id: `vendita-${i}-${j}`,
                  data_vendita: addDays(date, giorni_dalla_lead),
                  negozio_id: lead.negozio_assegnato_id,
                  lead_id: lead.id,
                  importo_totale: Math.random() * 18000 + 6000,
                  modello_cucina: "Modello " + String.fromCharCode(65 + Math.floor(Math.random()*5)),
                  giorni_dalla_lead: giorni_dalla_lead,
                  margine_percentuale: Math.random() * 0.15 + 0.20 // 20-35% margin
                });
            } else {
                lead.stato = 'perso';
            }
        }
      } else {
        lead.stato = Math.random() < 0.4 ? 'contattato' : 'perso';
      }
      leadData.push(lead);
    }
  }
  return { spesaData, leadData, venditaData };
}

export const { spesaData, leadData, venditaData } = generateRandomData();
