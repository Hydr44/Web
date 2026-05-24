# Staff Panel Credentials (ARCHIVIATO 2026-05-24)

> **NOTA**: documento archiviato. Il sottodominio `staff.rescuemanager.eu` e' stato
> dismesso a maggio 2026. Il pannello admin/staff e' ora una desktop app Electron
> (repo `admin-panel/`), non piu' una web app accessibile via URL.
> Le credenziali elencate qui sotto sono di riferimento storico — verificare lo
> stato corrente in Supabase (`staff` table) prima di considerarle valide.

## Accesso Staff Panel (storico)

Il pannello staff era accessibile tramite: `https://staff.rescuemanager.eu` (DNS dismesso)

## Credenziali di Accesso

### Admin (Amministratore)
- **Email:** `admin@rescuemanager.eu`
- **Password:** `AdminStaff2024!`
- **Ruolo:** Amministratore completo
- **Accesso:** Tutte le funzionalità

### Marketing
- **Email:** `marketing@rescuemanager.eu`
- **Password:** `MarketingStaff2024!`
- **Ruolo:** Marketing
- **Accesso:** Gestione lead, campagne, analytics

### Support
- **Email:** `support@rescuemanager.eu`
- **Password:** `SupportStaff2024!`
- **Ruolo:** Supporto clienti
- **Accesso:** Gestione ticket, supporto

## Sistema di Autenticazione

- **Autenticazione:** Supabase Auth (reale)
- **Database:** Supabase PostgreSQL
- **Sessione:** localStorage + Supabase session
- **Sicurezza:** Password complesse e sicure
- **RLS:** Row Level Security per accessi limitati

## Setup Iniziale

1. **Eseguire migrazione:** `supabase/migrations/20241223_create_staff_users_supabase.sql`
2. **Creare utenti staff:** Chiamare `/api/staff/create-users` (POST)
3. **Verificare accessi:** Login con credenziali sopra

## Note per lo Sviluppo

- Le credenziali sono create tramite API Supabase
- Il sistema di autenticazione usa Supabase Auth
- Dati reali dal database Supabase
- RLS policies per sicurezza

## Deployment

- Richiede configurazione Supabase
- Utenti creati tramite API
- Database con RLS policies
- Subdomain `staff.rescuemanager.eu` su Vercel
