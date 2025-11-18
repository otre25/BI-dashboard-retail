# Integrazione API - Dashboard BI Cucine Retail

## 🎯 Panoramica

Questa dashboard è stata **predisposta per integrare le API dei principali canali pubblicitari**, ma attualmente utilizza **dati mock** per lo sviluppo e testing.

### Canali Supportati

✅ **Meta Ads** (Facebook/Instagram)
✅ **Google Ads**
✅ **TikTok Ads**
🔄 **LinkedIn Ads** (struttura preparata)

---

## 🚀 Quick Start

### 1. Modalità Mock (Default)

Per default l'app utilizza dati di esempio. Nessuna configurazione necessaria.

```bash
npm install
npm run dev
```

### 2. Attivare le API Reali

1. Copia il file di esempio delle variabili d'ambiente:
   ```bash
   cp .env.example .env
   ```

2. Modifica il file `.env` e imposta:
   ```env
   VITE_USE_REAL_API=true
   ```

3. Aggiungi le tue credenziali API nel file `.env`:
   ```env
   # Meta Ads
   VITE_META_ACCESS_TOKEN=your_token_here
   VITE_META_ACCOUNT_ID=act_your_account_id

   # Google Ads
   VITE_GOOGLE_ACCESS_TOKEN=your_token_here
   VITE_GOOGLE_CUSTOMER_ID=your_customer_id
   # ... altre credenziali
   ```

4. Riavvia il server di sviluppo

---

## 📁 Struttura dei File API

```
bi-dashboard-cucine-retail/
├── types/
│   └── api.types.ts                  # Tipi TypeScript per le API
├── services/
│   ├── api/
│   │   ├── baseApiClient.ts          # Client HTTP base con retry/timeout
│   │   ├── metaAdsClient.ts          # Client Meta Ads API
│   │   ├── googleAdsClient.ts        # Client Google Ads API
│   │   └── tiktokAdsClient.ts        # Client TikTok Ads API
│   └── advertisingDataService.ts     # Servizio unificato
├── components/
│   └── settings/
│       └── ApiSettingsPanel.tsx      # Pannello configurazione API
├── docs/
│   └── API_INTEGRATION_GUIDE.md      # Guida completa all'integrazione
└── .env.example                       # Template variabili d'ambiente
```

---

## 🔧 Configurazione tramite UI

L'app include un **pannello di configurazione grafico** accessibile dalla sezione "Impostazioni API" nel menu principale.

### Funzionalità del pannello:

- ✅ Attiva/disattiva ogni canale pubblicitario
- ✅ Inserisci credenziali API in modo sicuro
- ✅ Testa la connessione prima di salvare
- ✅ Visualizza/nascondi token sensibili
- ✅ Feedback visivo sullo stato della connessione

---

## 💡 Esempio di Utilizzo

### Configurazione Programmatica

```typescript
import { advertisingDataService } from './services/advertisingDataService';

// Configura Meta Ads
advertisingDataService.configureChannel({
  channel: 'meta',
  enabled: true,
  credentials: {
    accessToken: 'EAAxxxxxxxxxxxxx',
    accountId: 'act_123456789',
  },
});

// Fetch dati da tutti i canali configurati
const data = await advertisingDataService.fetchAllChannelsData(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Testa connessione
const isConnected = await advertisingDataService.testConnection('meta');
console.log('Meta Ads connesso:', isConnected);
```

### Dati Normalizzati

Tutti i canali restituiscono dati in un **formato comune normalizzato**:

```typescript
interface NormalizedAdData {
  channel: 'meta' | 'google' | 'tiktok' | 'linkedin' | 'other';
  campaign_id: string;
  campaign_name: string;
  date: Date;
  spend: number;              // Spesa pubblicitaria
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_value: number;
  ctr: number;                // Click-Through Rate (%)
  cpc: number;                // Cost Per Click
  roas: number;               // Return on Ad Spend
  store_id?: number;          // Link opzionale al negozio
}
```

---

## 📚 Documentazione Completa

Per informazioni dettagliate su:
- Come ottenere le credenziali API per ogni canale
- Configurazione avanzata
- Best practices per la produzione
- Troubleshooting

👉 Consulta la [Guida Completa all'Integrazione API](./docs/API_INTEGRATION_GUIDE.md)

---

## ⚠️ Note Importanti per la Produzione

### Sicurezza

❌ **NON esporre mai le credenziali API nel frontend in produzione!**

✅ **Best Practice**:
1. Implementa un **backend/proxy** che gestisca le chiamate API
2. Memorizza i token in modo sicuro (variabili d'ambiente server-side, secrets manager)
3. Implementa il **refresh automatico dei token**
4. Aggiungi **caching** per ridurre le chiamate API
5. Implementa **rate limiting** per rispettare i limiti delle API

### Rate Limits

Ogni piattaforma ha limiti specifici:
- **Meta Ads**: 200 chiamate/ora per utente
- **Google Ads**: 15.000 operazioni/giorno
- **TikTok Ads**: 1.000 chiamate/minuto

---

## 🛠️ Caratteristiche Implementate

- ✅ Client API per Meta, Google e TikTok Ads
- ✅ Normalizzazione automatica dei dati
- ✅ Gestione retry ed errori
- ✅ Timeout configurabili
- ✅ UI per configurazione credenziali
- ✅ Test connessione per ogni canale
- ✅ Switch mock/real data
- ✅ Tipizzazione TypeScript completa

---

## 🔄 Roadmap Futura

- [ ] Backend proxy per sicurezza
- [ ] Gestione refresh token automatico
- [ ] Implementazione LinkedIn Ads
- [ ] Sincronizzazione automatica pianificata
- [ ] Caching avanzato
- [ ] Webhooks per aggiornamenti real-time
- [ ] Dashboard di monitoraggio sync status

---

## 📞 Supporto

Per domande o problemi relativi all'integrazione API:
1. Consulta la [documentazione completa](./docs/API_INTEGRATION_GUIDE.md)
2. Verifica la sezione Troubleshooting
3. Controlla i log della console del browser per errori specifici

---

**Versione**: 1.0.0
**Ultimo Aggiornamento**: Novembre 2024
