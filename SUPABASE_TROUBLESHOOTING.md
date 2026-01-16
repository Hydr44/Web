# 🔧 Troubleshooting Supabase

## ⚠️ Problema: Endpoint si blocca all'infinito

### 📅 Manutenzione Recente (16 Gennaio 2026)
Supabase ha completato una manutenzione programmata il 16/01/2026 alle 03:00 UTC. 
**Nota importante**: La manutenzione ha interessato Dashboard e Management API, ma **NON** i progetti e il traffico HTTP/Postgres che dovrebbero funzionare normalmente.

Se riscontri problemi dopo questa data, potrebbero essere:
- Effetti residui dalla manutenzione
- Progetto Supabase in pausa (piano gratuito)
- Problemi di rete/VPS

### Possibili Cause

1. **Progetto Supabase in PAUSA** (PIÙ PROBABILE)
   - Piano gratuito: Supabase mette in pausa progetti inattivi
   - Soluzione: Vai su https://supabase.com/dashboard → Seleziona progetto → Clicca "Resume"

2. **Problemi di Rete/VPS**
   - Firewall blocca connessioni a Supabase
   - DNS non risolve correttamente
   - Soluzione: Verifica configurazione VPS

3. **Supabase Temporaneamente Non Disponibile**
   - Verifica: https://status.supabase.com
   - Controlla la tua regione (EU-West, US-East, ecc.)

### Test Rapido

1. **Test Endpoint**:
   ```
   https://rescuemanager.eu/api/test/supabase
   ```
   Dovrebbe rispondere entro 5 secondi con i risultati dei test.

2. **Verifica Progetto Supabase**:
   - Vai su https://supabase.com/dashboard
   - Controlla se il progetto mostra "Paused" o "Resume"
   - Se in pausa, clicca "Resume" e attendi 1-2 minuti

3. **Test Connessione Diretta**:
   ```bash
   curl -H "apikey: YOUR_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
        https://YOUR_PROJECT.supabase.co/rest/v1/
   ```

### Log da Controllare

Quando provi a fare login, controlla i log del server:
- `[Staff Auth] Calling supabaseAdmin.auth.admin.listUsers()...`
- Se vedi timeout dopo 5 secondi → Progetto in pausa o non raggiungibile

### Soluzione: Riavvia il Progetto Supabase

**Questo è spesso la soluzione migliore!** Riavviare il progetto Supabase può risolvere:
- Timeout e connessioni bloccate
- Progetto in pausa (piano gratuito)
- Problemi residui dopo manutenzione
- Cache o connessioni stale

#### Come Riavviare:

1. **Vai al Dashboard Supabase**:
   - Apri https://supabase.com/dashboard
   - Accedi con le tue credenziali

2. **Seleziona il Progetto**:
   - Clicca sul progetto RescueManager dalla lista

3. **Riavvia il Progetto**:
   - **Se vedi "Paused"**: Clicca il pulsante **"Resume"** (o "Riprendi")
   - **Se il progetto è attivo**: Vai su **Settings** → **General** → **Restart Project** (o "Riavvia Progetto")
   - In alternativa, puoi anche:
     - Mettere in pausa il progetto (se disponibile)
     - Attendere 30 secondi
     - Riprendere il progetto

4. **Attendi la Riattivazione**:
   - Il riavvio richiede **1-3 minuti**
   - Vedrai un indicatore di progresso
   - Non chiudere la pagina durante il riavvio

5. **Verifica il Riavvio**:
   - Controlla che il progetto mostri "Active" o "Running"
   - Testa l'endpoint: `https://rescuemanager.eu/api/test/supabase`
   - Dovrebbe rispondere entro 3-5 secondi

6. **Riprova il Login**:
   - Prova il login nell'admin panel
   - Prova il login nell'app desktop
   - Entrambi dovrebbero funzionare correttamente

#### Nota Importante:
- **Piano Gratuito**: I progetti vengono messi in pausa automaticamente dopo periodi di inattività
- **Dopo Riavvio**: Il primo accesso potrebbe essere leggermente più lento (cold start)
- **Frequenza**: Puoi riavviare il progetto quante volte vuoi, non ci sono limiti

### Verifica Configurazione

Controlla che le variabili d'ambiente siano corrette:
- `NEXT_PUBLIC_SUPABASE_URL` - URL completo del progetto
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (non anon key!)
