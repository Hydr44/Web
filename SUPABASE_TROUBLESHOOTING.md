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

### Soluzione Temporanea

Se Supabase è in pausa e non puoi riattivarlo subito:
1. Vai su https://supabase.com/dashboard
2. Clicca "Resume" sul progetto
3. Attendi 1-2 minuti per la riattivazione
4. Riprova il login

### Verifica Configurazione

Controlla che le variabili d'ambiente siano corrette:
- `NEXT_PUBLIC_SUPABASE_URL` - URL completo del progetto
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (non anon key!)
