# Configurazione GitHub Secrets per Supabase

## Passaggi da seguire su GitHub

1. Vai su: https://github.com/otre25/BI-dashboard-retail/settings/secrets/actions

2. Clicca su **"New repository secret"**

3. Aggiungi il primo secret:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://ytckliqemmbwuoocdhei.supabase.co`
   - Clicca su **"Add secret"**

4. Clicca di nuovo su **"New repository secret"**

5. Aggiungi il secondo secret:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y2tsaXFlbW1id3Vvb2NkaGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njc2OTcsImV4cCI6MjA3OTA0MzY5N30.OWSrcfix8lo1vupUhV_NSVKtb6sCiNeT_MduiF2Ezco`
   - Clicca su **"Add secret"**

## Verifica

Dovresti vedere entrambi i secrets nella lista:
- ✓ VITE_SUPABASE_URL
- ✓ VITE_SUPABASE_ANON_KEY

## Dopo aver aggiunto i secrets

Dimmi "fatto" e procederò con il push delle modifiche al workflow.
Il deploy partirà automaticamente e questa volta dovrebbe funzionare!
