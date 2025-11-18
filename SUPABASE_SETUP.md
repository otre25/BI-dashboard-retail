# 🚀 Supabase Setup - Guida Completa

Segui questi passaggi per configurare il backend dell'app con Supabase.

## Step 1: Ottieni le credenziali Supabase

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clicca sul tuo progetto
3. Vai su **Settings** → **API**
4. Copia:
   - **Project URL** (esempio: `https://abcdefgh.supabase.co`)
   - **anon/public key** (la chiave che inizia con `eyJ...`)

## Step 2: Configura le variabili ambiente

1. Crea un file `.env` nella root del progetto:
```bash
cp .env.example .env
```

2. Modifica `.env` e sostituisci i valori:
```env
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...tua-chiave-qui
```

## Step 3: Crea il Database Schema

1. Vai su **SQL Editor** nel dashboard Supabase
2. Copia e incolla questo script SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  currency TEXT DEFAULT 'EUR',
  timezone TEXT DEFAULT 'Europe/Rome',
  fiscal_year_start TEXT DEFAULT '01-01',
  default_date_range INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'viewer')) NOT NULL DEFAULT 'viewer',
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('advertising', 'operations', 'salaries', 'other')) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  period TEXT CHECK (period IN ('monthly', 'quarterly', 'yearly')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  currency TEXT DEFAULT 'EUR',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget allocations table
CREATE TABLE budget_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  channel TEXT,
  store_id TEXT,
  allocated DECIMAL(15, 2) NOT NULL,
  spent DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget alerts table
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('warning', 'danger', 'exceeded')) NOT NULL,
  threshold INTEGER NOT NULL,
  message TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE
);

-- OAuth connections table
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('meta', 'google', 'tiktok')) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, provider)
);

-- Data sources table
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('airtable', 'notion', 'googlesheets', 'excel')) NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  credentials JSONB NOT NULL,
  mappings JSONB DEFAULT '[]',
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_interval INTEGER,
  auto_sync BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Clicca **Run** per eseguire lo script

## Step 4: Abilita Row Level Security (RLS)

1. Nel **SQL Editor**, esegui:

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

-- Policies for companies
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT
  USING (id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Policies for users
CREATE POLICY "Users can view users in their company" ON users
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Policies for budgets
CREATE POLICY "Users can view budgets in their company" ON budgets
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Managers can insert budgets" ON budgets
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Policies for budget_allocations
CREATE POLICY "Users can view allocations in their company" ON budget_allocations
  FOR SELECT
  USING (budget_id IN (
    SELECT id FROM budgets WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

-- Policies for budget_alerts
CREATE POLICY "Users can view alerts in their company" ON budget_alerts
  FOR SELECT
  USING (budget_id IN (
    SELECT id FROM budgets WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

-- Policies for oauth_connections
CREATE POLICY "Users can view oauth in their company" ON oauth_connections
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Policies for data_sources
CREATE POLICY "Users can view data sources in their company" ON data_sources
  FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));
```

## Step 5: Configura Email Authentication

1. Vai su **Authentication** → **Providers** →  **Email**
2. Abilita "Enable Email provider"
3. (Opzionale) Personalizza i template email

## Step 6: Crea un utente demo

1. Nel **SQL Editor**, esegui:

```sql
-- Create demo company
INSERT INTO companies (id, name, industry)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Company', 'retail');

-- Create demo user (password: demo123)
-- Note: This will be created via Supabase Auth, not directly in the users table
```

2. Oppure usa **Authentication** → **Users** → **Add user**:
   - Email: `demo@example.com`
   - Password: `demo123`
   - Auto Confirm User: ✅

3. Poi collega l'utente alla company:

```sql
INSERT INTO users (id, email, name, role, company_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@example.com'),
  'demo@example.com',
  'Demo User',
  'admin',
  '00000000-0000-0000-0000-000000000001'
);
```

## Step 7: Testa la connessione

1. Riavvia il server di sviluppo:
```bash
npm run dev
```

2. Apri http://localhost:3000
3. Prova a fare login con:
   - Email: `demo@example.com`
   - Password: `demo123`

## 🎉 Setup Completato!

Ora puoi:
- ✅ Autenticarti nell'app
- ✅ Gestire utenti e ruoli
- ✅ Creare budget e allocation
- ✅ Configurare data sources

## 📚 Risorse Utili

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## ❓ Troubleshooting

### Errore: "Invalid API key"
- Verifica che la chiave in `.env` sia corretta
- Assicurati di usare la **anon key**, non la service_role key

### Errore: "RLS policy violation"
- Verifica che le policy RLS siano state create
- Controlla che l'utente sia collegato a una company

### Non riesco a fare login
- Verifica che l'utente sia stato creato in **Authentication** → **Users**
- Controlla che l'utente esista anche nella tabella `users`
