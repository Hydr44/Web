# 🚀 Guida all'Avvio del Progetto

## Prerequisiti

- Node.js (versione 18 o superiore)
- npm (incluso con Node.js)

## Configurazione Rapida

### Opzione 1: Script Automatico (Consigliato)

Esegui lo script PowerShell dalla directory `website`:

```powershell
cd website
.\start-dev.ps1
```

Lo script:
- ✅ Verifica Node.js e npm
- ✅ Crea il file `.env.local` se non esiste
- ✅ Installa le dipendenze se necessario
- ✅ Avvia il server di sviluppo

### Opzione 2: Configurazione Manuale

1. **Crea il file `.env.local`** nella directory `website`:

```env
# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=la_tua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_tua_chiave_anon
SUPABASE_SERVICE_ROLE_KEY=la_tua_service_role_key

# Stripe Configuration (opzionale per sviluppo)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# RENTRI JWT Configuration (opzionale per sviluppo)
RENTRI_JWT_PRIVATE_KEY=
RENTRI_JWT_PRIVATE_KEY_FILE=
RENTRI_JWT_CERT=
RENTRI_JWT_CERT_FILE=
RENTRI_JWT_AUDIENCE=rentrigov.demo.api
RENTRI_JWT_ISSUER=
RENTRI_JWT_TTL_SECONDS=55

# Cron Secret (opzionale per sviluppo)
CRON_SECRET=dev-secret-change-in-prod

# Cookie Domain (opzionale)
NEXT_PUBLIC_COOKIE_DOMAIN=
```

2. **Installa le dipendenze** (se non già installate):

```powershell
cd website
npm install
```

3. **Avvia il server di sviluppo**:

```powershell
npm run dev
```

## Risoluzione Problemi

### Errore: "Supabase non configurato"

Assicurati di aver compilato le variabili d'ambiente in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Errore: "Cannot find module"

Esegui:
```powershell
npm install
```

### Errore: Porta 3000 già in uso

Il server proverà automaticamente la porta successiva (3001, 3002, ecc.)

### Errore: Turbopack

Se Turbopack causa problemi, puoi modificare `package.json` e rimuovere `--turbopack`:

```json
"dev": "next dev"
```

## Note

- Il progetto usa **Next.js 15** con **Turbopack** per build più veloci
- Il server di sviluppo sarà disponibile su `http://localhost:3000`
- Le modifiche ai file vengono rilevate automaticamente (hot reload)

