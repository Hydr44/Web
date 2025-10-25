# Staff Panel Credentials

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

## Sicurezza

- Le credenziali sono hardcoded per semplicità
- In produzione, dovrebbero essere gestite tramite database
- Le password sono complesse e sicure
- Ogni ruolo ha accessi limitati alle funzionalità

## Note per lo Sviluppo

- Le credenziali sono definite in `src/lib/staff-auth-real.ts`
- Il sistema di autenticazione è completamente separato dal main app
- Non richiede variabili d'ambiente aggiuntive
- Funziona con localStorage per la sessione

## Deployment

- Le credenziali funzionano sia in sviluppo che in produzione
- Non è necessario configurare variabili d'ambiente aggiuntive
- Il subdomain `staff.rescuemanager.eu` deve essere configurato su Vercel
