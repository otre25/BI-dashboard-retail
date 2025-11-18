# Guida all'Integrazione delle API dei Canali Pubblicitari

Questa guida spiega come configurare e utilizzare le API dei principali canali pubblicitari nella dashboard BI.

## Indice

1. [Panoramica](#panoramica)
2. [Configurazione Iniziale](#configurazione-iniziale)
3. [Meta Ads (Facebook/Instagram)](#meta-ads)
4. [Google Ads](#google-ads)
5. [TikTok Ads](#tiktok-ads)
6. [Struttura dei Dati](#struttura-dei-dati)
7. [Troubleshooting](#troubleshooting)

---

## Panoramica

L'applicazione è predisposta per integrarsi con le seguenti piattaforme pubblicitarie:
- **Meta Ads** (Facebook e Instagram)
- **Google Ads**
- **TikTok Ads**
- **LinkedIn Ads** (struttura preparata, implementazione da completare)

### Architettura

```
services/
├── api/
│   ├── baseApiClient.ts      # Client HTTP base con retry e timeout
│   ├── metaAdsClient.ts       # Client per Meta Ads API
│   ├── googleAdsClient.ts     # Client per Google Ads API
│   └── tiktokAdsClient.ts     # Client per TikTok Ads API
└── advertisingDataService.ts  # Servizio unificato per tutti i canali
```

---

## Configurazione Iniziale

### 1. Variabili d'Ambiente

Copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
```

### 2. Abilita l'Uso delle API Reali

Nel file `.env`, imposta:

```env
VITE_USE_REAL_API=true
```

⚠️ **Importante**: Se `VITE_USE_REAL_API=false`, l'app continuerà a usare i dati mock.

---

## Meta Ads (Facebook/Instagram)

### Ottenere le Credenziali

1. Vai su [Meta for Developers](https://developers.facebook.com/)
2. Crea o seleziona un'app esistente
3. Aggiungi il prodotto "Marketing API"
4. Genera un Access Token con i permessi:
   - `ads_read`
   - `ads_management`
   - `business_management`

### Configurazione

Nel file `.env`:

```env
VITE_META_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
VITE_META_ACCOUNT_ID=act_123456789
```

### Codice di Esempio

```typescript
import { advertisingDataService } from './services/advertisingDataService';

// Configura Meta Ads
advertisingDataService.configureChannel({
  channel: 'meta',
  enabled: true,
  credentials: {
    accessToken: import.meta.env.VITE_META_ACCESS_TOKEN,
    accountId: import.meta.env.VITE_META_ACCOUNT_ID,
  },
});

// Testa la connessione
const isConnected = await advertisingDataService.testConnection('meta');
console.log('Meta Ads connesso:', isConnected);
```

### Metriche Disponibili

- Spesa pubblicitaria (spend)
- Impressioni (impressions)
- Click (clicks)
- Reach
- CTR (Click-Through Rate)
- CPC (Cost Per Click)
- CPM (Cost Per Mille)
- Conversioni (conversions)
- Valore conversioni (conversion_value)

---

## Google Ads

### Ottenere le Credenziali

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita la "Google Ads API"
4. Crea credenziali OAuth 2.0
5. Ottieni il Customer ID dal tuo account Google Ads

### Configurazione

Nel file `.env`:

```env
VITE_GOOGLE_ACCESS_TOKEN=ya29.xxxxxxxxxxxxx
VITE_GOOGLE_CUSTOMER_ID=1234567890
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

### Codice di Esempio

```typescript
advertisingDataService.configureChannel({
  channel: 'google',
  enabled: true,
  credentials: {
    accessToken: import.meta.env.VITE_GOOGLE_ACCESS_TOKEN,
    accountId: import.meta.env.VITE_GOOGLE_CUSTOMER_ID,
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  },
});
```

### Note Importanti

- Google Ads usa i "micros" (1/1.000.000 di valuta) per i costi. Il client normalizza automaticamente questi valori.
- L'API usa Google Ads Query Language (GAQL) per le query.

### Metriche Disponibili

- Costo in micros (cost_micros)
- Impressioni
- Click
- Conversioni
- Valore conversioni (conversions_value)
- CTR
- CPC medio (average_cpc)

---

## TikTok Ads

### Ottenere le Credenziali

1. Vai su [TikTok for Business](https://ads.tiktok.com/)
2. Accedi al TikTok Ads Manager
3. Vai su "Assets" → "Events" → "Web Events" → "Manage"
4. Crea un Access Token con le autorizzazioni necessarie
5. Ottieni l'Advertiser ID dal tuo account

### Configurazione

Nel file `.env`:

```env
VITE_TIKTOK_ACCESS_TOKEN=xxxxxxxxxxxxx
VITE_TIKTOK_ADVERTISER_ID=1234567890123456
```

### Codice di Esempio

```typescript
advertisingDataService.configureChannel({
  channel: 'tiktok',
  enabled: true,
  credentials: {
    accessToken: import.meta.env.VITE_TIKTOK_ACCESS_TOKEN,
    accountId: import.meta.env.VITE_TIKTOK_ADVERTISER_ID,
  },
});
```

### Metriche Disponibili

- Spesa (spend)
- Impressioni
- Click
- CTR
- CPC
- Conversioni (conversion)
- Costo per conversione (cost_per_conversion)
- Valore totale acquisti (total_purchase_value)

---

## Struttura dei Dati

### Dati Normalizzati

Tutti i canali restituiscono dati in un formato normalizzato (`NormalizedAdData`):

```typescript
interface NormalizedAdData {
  channel: 'meta' | 'google' | 'tiktok' | 'linkedin' | 'other';
  campaign_id: string;
  campaign_name: string;
  date: Date;
  spend: number;              // Spesa in valuta locale
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_value: number;
  ctr: number;                // Click-Through Rate (%)
  cpc: number;                // Cost Per Click
  roas: number;               // Return on Ad Spend
  store_id?: number;          // Optional: collegamento al negozio
}
```

### Fetch dei Dati

```typescript
import { advertisingDataService } from './services/advertisingDataService';

// Fetch dati da tutti i canali configurati
const data = await advertisingDataService.fetchAllChannelsData(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

console.log('Dati pubblicitari:', data);
```

---

## Troubleshooting

### Problema: "Request Failed" o timeout

**Soluzione**:
- Verifica che l'Access Token sia valido e non scaduto
- Controlla i permessi dell'Access Token
- Aumenta il timeout nel `BaseApiClient` se necessario

### Problema: "Invalid Account ID"

**Soluzione**:
- Per Meta Ads, l'Account ID deve iniziare con `act_`
- Per Google Ads, usa solo numeri (senza trattini)
- Per TikTok Ads, verifica l'Advertiser ID nelle impostazioni

### Problema: Dati non visualizzati nella dashboard

**Soluzione**:
1. Verifica che `VITE_USE_REAL_API=true` nel file `.env`
2. Controlla la console del browser per eventuali errori
3. Testa la connessione usando `testConnection()`
4. Verifica che le date richieste rientrino nel periodo disponibile

### Problema: CORS Error

**Soluzione**:
- Le chiamate API devono passare attraverso un backend/proxy per motivi di sicurezza
- In produzione, implementa un backend che gestisca le chiamate API
- Non esporre mai gli Access Token nel frontend in produzione

---

## Best Practices per la Produzione

### 1. Backend Proxy

Implementa un backend Node.js/Python che:
- Gestisce le chiamate API
- Memorizza in modo sicuro i token
- Implementa il refresh automatico dei token
- Aggiunge caching per ridurre le chiamate API

### 2. Gestione Token

```typescript
// Esempio di refresh token automatico
class TokenManager {
  async refreshToken(channel: string): Promise<string> {
    // Implementa la logica di refresh specifico del canale
  }
}
```

### 3. Caching

```typescript
// Implementa un layer di cache
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minuti

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 4. Rate Limiting

Implementa rate limiting per rispettare i limiti delle API:

- **Meta Ads**: 200 chiamate per ora per utente
- **Google Ads**: 15.000 operazioni al giorno
- **TikTok Ads**: 1.000 chiamate al minuto

---

## Prossimi Passi

1. ✅ Struttura API implementata
2. ✅ Client per Meta, Google e TikTok Ads
3. ✅ Normalizzazione dei dati
4. 🔄 Implementare backend proxy per sicurezza
5. 🔄 Aggiungere gestione refresh token
6. 🔄 Implementare LinkedIn Ads client
7. 🔄 Aggiungere sincronizzazione automatica pianificata
8. 🔄 Implementare caching e ottimizzazioni

---

Per ulteriore assistenza, consulta la documentazione ufficiale:
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [TikTok Marketing API](https://ads.tiktok.com/marketing_api/docs)
