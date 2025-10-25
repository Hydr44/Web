vor# Staff Panel Credentials

## Accesso Staff Panel

Il pannello staff è accessibile tramite: `https://staff.rescuemanager.eu`

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
