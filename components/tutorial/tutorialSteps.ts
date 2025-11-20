import type { Step } from 'react-joyride';

export const tutorialSteps: Step[] = [
  {
    target: 'body',
    content: 'Benvenuto nella tua Dashboard BI per Cucine Retail! Ti mostrerò le funzionalità principali in pochi passaggi.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="filters"]',
    content: 'Qui puoi filtrare i dati per periodo, negozi specifici e canali di marketing. I dati si aggiornano automaticamente.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="kpi-grid"]',
    content: 'Questi KPI mostrano le metriche chiave: spesa pubblicitaria, ROAS, MER, CAC, tasso di conversione e profittabilità. Il colore indica le performance.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="charts"]',
    content: 'I grafici visualizzano i tuoi dati. Puoi trascinarli per riordinarli e cliccare sull\'icona espandi per vederli a schermo intero!',
    placement: 'top',
  },
  {
    target: '[data-tour="trend-chart"]',
    content: 'Questo grafico mostra l\'andamento di spesa pubblicitaria e fatturato nel tempo. Perfetto per identificare trend e stagionalità.',
    placement: 'top',
  },
  {
    target: '[data-tour="header-tabs"]',
    content: 'Naviga tra le diverse sezioni: Dashboard principale, Advertising (dettagli campagne), Vendite, Report e Impostazioni.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="quick-actions"]',
    content: 'Qui trovi azioni rapide: importa i tuoi dati da CSV/JSON, esporta report, condividi la dashboard, cambia tema e riavvia il tutorial!',
    placement: 'bottom',
  },
  {
    target: 'body',
    content: 'Ottimo! Ora sei pronto per esplorare la dashboard. Usa "Importa Dati" per caricare i tuoi file con rilevamento automatico dei campi. Buon lavoro! 🚀',
    placement: 'center',
  },
];
