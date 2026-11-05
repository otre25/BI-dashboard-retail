import type { Negozio } from '../types';
import { CanaleEnum } from '../types';
import type { KpiInput } from './kpi';

export interface StoreCacRow {
  id: number;
  nome: string;
  citta: string;
  leads: number;
  /** Vendite concluse nel periodo (per data di vendita, come il MER). */
  venduti: number;
  spesaAttribuita: number;
  fatturato: number;
  /** null quando il negozio non ha vendite nel periodo: il CAC non è definito. */
  cac: number | null;
}

export interface StoreCacResult {
  rows: StoreCacRow[];
  /** CAC complessivo sui negozi considerati (spesa attribuita / vendite del periodo). */
  averageCac: number | null;
  /** Spesa di canali senza alcun lead nel periodo: non attribuibile a nessun negozio. */
  unattributedSpend: number;
}

/**
 * Attribuisce la spesa pubblicitaria ai negozi in proporzione ai lead ricevuti,
 * canale per canale (la spesa Google va ai negozi in base ai lead Google, ecc.).
 * È un criterio dichiarato, non un dato misurato: la spesa non nasce per negozio.
 * Il CAC usa le vendite avvenute nel periodo: i lead recenti chiudono 5-30 giorni dopo,
 * quindi contare i lead "venduti" in una finestra corta darebbe un CAC gonfiato.
 */
export const calculateStoreCac = (data: KpiInput): StoreCacResult => {
  const channels = Object.values(CanaleEnum);
  const attributed = new Map<number, number>();
  let unattributedSpend = 0;

  channels.forEach(canale => {
    const spend = data.spese.filter(s => s.canale === canale).reduce((sum, s) => sum + s.spesa, 0);
    const channelLeads = data.leads.filter(l => l.canale_provenienza === canale);
    if (spend === 0) return;
    if (channelLeads.length === 0) {
      unattributedSpend += spend;
      return;
    }
    channelLeads.forEach(l => {
      attributed.set(l.negozio_assegnato_id, (attributed.get(l.negozio_assegnato_id) ?? 0) + spend / channelLeads.length);
    });
  });

  const rows: StoreCacRow[] = data.activeNegozi.map((n: Negozio) => {
    const leads = data.leads.filter(l => l.negozio_assegnato_id === n.id);
    const vendite = data.vendite.filter(v => v.negozio_id === n.id);
    const venduti = vendite.length;
    const spesaAttribuita = attributed.get(n.id) ?? 0;
    return {
      id: n.id,
      nome: n.nome,
      citta: n.citta,
      leads: leads.length,
      venduti,
      spesaAttribuita,
      fatturato: vendite.reduce((sum, v) => sum + v.importo_totale, 0),
      cac: venduti > 0 ? spesaAttribuita / venduti : null,
    };
  });

  rows.sort((a, b) => {
    if (a.cac === null) return 1;
    if (b.cac === null) return -1;
    return a.cac - b.cac;
  });

  const totalAttributed = rows.reduce((sum, r) => sum + r.spesaAttribuita, 0);
  const totalSold = rows.reduce((sum, r) => sum + r.venduti, 0);
  return { rows, averageCac: totalSold > 0 ? totalAttributed / totalSold : null, unattributedSpend };
};
