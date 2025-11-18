# 📊 Executive BI Dashboard - Cucine Retail

![Dashboard Preview](https://img.shields.io/badge/status-production--ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19.0-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff)

Una **dashboard Business Intelligence completa e professionale** per l'analisi delle performance di vendita e marketing nel settore retail delle cucine. Sviluppata con React, TypeScript e Tailwind CSS, offre visualizzazioni avanzate, gestione filtri dinamici e integrazione API con i principali canali pubblicitari.

## ✨ Caratteristiche Principali

### 📈 Dashboard Analytics
- **KPI Cards Interattive**: Spesa pubblicitaria, MER, CAC, tasso di conversione, fatturato e profittabilità
- **Grafici Dinamici**: Andamento vendite, ROAS per canale, mappa calore negozi, funnel di conversione
- **Drag & Drop**: Riordina KPI e grafici secondo le tue preferenze
- **Espansione Grafici**: Espandi i grafici per una vista dettagliata o fullscreen
- **Confronto Periodi**: Confronta periodi personalizzati side-by-side

### 🎯 Sezione Advertising
- Dashboard campagne pubblicitarie per canale (Meta, Google, TikTok, LinkedIn)
- Performance metrics dettagliate (CTR, CPC, CPM, ROAS)
- Analisi geografica delle campagne
- Budget tracking e ottimizzazione

### 💰 Sezione Sales
- Analisi vendite per negozio e regione
- Mappa interattiva dell'Italia con heatmap vendite
- Performance per categoria prodotto
- Trend stagionali e previsioni

### 📋 Report & Alerts
- Report automatici programmabili
- Sistema di notifiche per soglie KPI
- Export personalizzabile (PDF, PNG, Excel)
- Template report predefiniti

### ⚙️ Configurazione API
- **Integrazione nativa** con Meta Ads, Google Ads, TikTok Ads
- UI per configurazione credenziali API
- Test connessione in tempo reale
- Switch mock/real data per sviluppo

### 🎨 UX/UI Avanzata
- **Design System** con tokens personalizzabili
- **Dark/Light Mode** con persistenza preferenze
- **Responsive Design** ottimizzato per mobile, tablet e desktop
- **Accessibilità**: ARIA labels, keyboard navigation, focus management
- **Animazioni fluide** e transizioni professionali

### 🔄 Persistenza & Condivisione
- **LocalStorage**: Salvataggio automatico preferenze utente
- **URL State**: Condividi snapshot dashboard via URL
- **Export Personalizzato**: Scegli cosa esportare e in quale formato

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ e npm
- Git

### Installazione

```bash
# Clona il repository
git clone https://github.com/otre25/bi-dashboard-cucine-retail.git

# Entra nella directory
cd bi-dashboard-cucine-retail

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

L'applicazione sarà disponibile su **http://localhost:3000**

### Build per Produzione

```bash
npm run build
npm run preview
```

## 📁 Struttura del Progetto

```
bi-dashboard-cucine-retail/
├── components/           # Componenti React riutilizzabili
│   ├── advertising/     # Sezione advertising
│   ├── sales/          # Sezione sales
│   ├── reports/        # Sezione reports & alerts
│   ├── settings/       # Pannello configurazione API
│   └── ui/             # Componenti UI base
├── hooks/              # Custom React hooks
│   ├── useAnalyticsData.ts
│   ├── useUrlState.ts
│   └── useTheme.ts
├── services/           # Servizi e API clients
│   ├── api/
│   │   ├── metaAdsClient.ts
│   │   ├── googleAdsClient.ts
│   │   └── tiktokAdsClient.ts
│   └── advertisingDataService.ts
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── lib/                # Utilities e mock data
├── docs/               # Documentazione completa
└── README_API.md       # Guida integrazione API
```

## 🔌 Integrazione API

L'app è **predisposta per l'integrazione con le API** dei principali canali pubblicitari:

### Canali Supportati
- ✅ **Meta Ads** (Facebook/Instagram)
- ✅ **Google Ads**
- ✅ **TikTok Ads**
- 🔄 **LinkedIn Ads** (struttura preparata)

### Configurazione Rapida

1. Copia `.env.example` in `.env`:
   ```bash
   cp .env.example .env
   ```

2. Attiva le API reali:
   ```env
   VITE_USE_REAL_API=true
   ```

3. Configura le credenziali tramite UI o file `.env`

Per la guida completa, consulta [README_API.md](./README_API.md) e [API Integration Guide](./docs/API_INTEGRATION_GUIDE.md)

## 🛠️ Stack Tecnologico

- **Framework**: React 19 + TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand (con persist middleware)
- **Charts**: Recharts
- **Date Management**: date-fns
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Type Safety**: TypeScript strict mode

## 📊 Metriche e KPI

### KPI Tracciati
- **Spesa Pubblicitaria**: Budget totale investito
- **MER (Marketing Efficiency Ratio)**: Efficienza marketing complessiva
- **CAC (Customer Acquisition Cost)**: Costo acquisizione cliente
- **Tasso di Conversione**: % lead → clienti
- **Fatturato**: Vendite totali
- **Profittabilità per m²**: Rendimento per metro quadro

### Grafici Disponibili
- Andamento vendite nel tempo (line chart)
- ROAS per canale pubblicitario (bar chart)
- Mappa calore negozi Italia (interactive map)
- Funnel di conversione (funnel chart)
- Performance campagne (mixed charts)

## 🎯 Roadmap

- [x] Dashboard principale con KPI
- [x] Sezioni Advertising, Sales, Reports
- [x] Drag & Drop per riordinare elementi
- [x] Persistenza preferenze in localStorage
- [x] Export personalizzato (PDF, PNG, Excel)
- [x] Zoom e fullscreen sui grafici
- [x] Condivisione snapshot via URL
- [x] Integrazione API Meta/Google/TikTok Ads
- [ ] Backend proxy per sicurezza API
- [ ] Refresh token automatico
- [ ] Sincronizzazione automatica pianificata
- [ ] Webhooks per aggiornamenti real-time
- [ ] Dashboard personalizzabili multi-utente
- [ ] Machine Learning per previsioni

## 🤝 Contribuire

I contributi sono benvenuti! Per favore:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Pusha il branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## 👤 Autore

**Alberto Pasinati**
- GitHub: [@otre25](https://github.com/otre25)

## 🙏 Ringraziamenti

- Design ispirato alle best practices di dashboard analytics moderne
- Dati mock generati per scopi dimostrativi
- Community open source per gli strumenti utilizzati

---

**Made with ❤️ for the Retail Kitchen Industry**
