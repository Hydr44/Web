# 🔍 ANALISI COMPLETA SUPABASE AUTH

## 📋 PIANO DI DIAGNOSI E RISOLUZIONE

### 🎯 OBIETTIVO
Risolvere completamente i problemi di autenticazione Supabase e rimuovere il sistema BYPASS temporaneo.

---

## 🔍 FASE 1: DIAGNOSI COMPLETA

### 1.1 CONFIGURAZIONE SUPABASE

#### **Come ottenere le informazioni:**

**A. URL del progetto Supabase:**
1. Vai su [supabase.com](https://supabase.com)
2. Accedi al tuo progetto
3. Vai su **Settings** → **API**
4. Copia il **Project URL**
```
Esempio: https://ienzdgrqalltvkdkuamp.supabase.co
```

**B. Chiavi API:**
1. Nella stessa pagina **Settings** → **API**
2. Copia:
   - **anon/public key** (per il frontend)
   - **service_role key** (per il backend - NON condividere!)

**C. Configurazione Auth Settings:**
1. Vai su **Authentication** → **Settings**
2. Controlla:
   - **Site URL**: deve essere `https://rescuemanager.eu`
   - **Redirect URLs**: deve includere `https://rescuemanager.eu/**`
   - **Email Auth**: deve essere abilitato
   - **Email Confirmations**: configurazione

**D. RLS (Row Level Security) Policies:**
1. Vai su **Authentication** → **Policies**
2. Controlla le policies per le tabelle:
   - `profiles`
   - `orgs`
   - `vehicles`
   - `drivers`
   - etc.

### 1.2 CONFIGURAZIONE AMBIENTE

#### **Variabili d'ambiente (.env.local):**
```bash
# Controlla se hai queste variabili:
NEXT_PUBLIC_SUPABASE_URL=https://ienzdgrqalltvkdkuamp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Configurazione Vercel:**
1. Vai su [vercel.com](https://vercel.com)
2. Seleziona il progetto `webapp`
3. Vai su **Settings** → **Environment Variables**
4. Controlla che le variabili siano impostate per **Production**

### 1.3 LOGS DETTAGLIATI

#### **A. Console del browser:**
1. Apri `https://rescuemanager.eu/login`
2. Premi **F12** per aprire DevTools
3. Vai su **Console**
4. Prova a fare login
5. Copia tutti gli errori che appaiono

#### **B. Network tab:**
1. Nello stesso DevTools, vai su **Network**
2. Prova a fare login
3. Cerca richieste a `supabase.co`
4. Controlla:
   - Status code (200, 400, 500, etc.)
   - Response body
   - Headers

#### **C. Supabase Dashboard logs:**
1. Vai su Supabase Dashboard
2. Vai su **Logs** → **Auth**
3. Prova a fare login
4. Controlla i log per errori

#### **D. Vercel function logs:**
1. Vai su Vercel Dashboard
2. Seleziona il progetto
3. Vai su **Functions** → **Logs**
4. Controlla errori durante il login

### 1.4 TEST DI CONNETTIVITÀ

#### **A. Test diretto Supabase API:**
```bash
# Sostituisci YOUR_ANON_KEY con la tua chiave
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://ienzdgrqalltvkdkuamp.supabase.co/rest/v1/"
```

#### **B. Test auth endpoints:**
```bash
# Test signup
curl -X POST "https://ienzdgrqalltvkdkuamp.supabase.co/auth/v1/signup" \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'

# Test signin
curl -X POST "https://ienzdgrqalltvkdkuamp.supabase.co/auth/v1/token?grant_type=password" \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
```

#### **C. Test database queries:**
```bash
# Test query semplice
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://ienzdgrqalltvkdkuamp.supabase.co/rest/v1/orgs?select=*"
```

---

## 🔧 FASE 2: SOLUZIONI POSSIBILI

### 2.1 PROBLEMI COMUNI E SOLUZIONI

#### **A. Site URL non configurato:**
- **Problema**: Supabase blocca le richieste da domini non autorizzati
- **Soluzione**: Aggiungere `https://rescuemanager.eu` in Auth Settings

#### **B. RLS policies troppo restrittive:**
- **Problema**: Le policies bloccano l'accesso ai dati
- **Soluzione**: Rivedere e correggere le policies

#### **C. Variabili d'ambiente sbagliate:**
- **Problema**: Chiavi API errate o mancanti
- **Soluzione**: Verificare e correggere le variabili

#### **D. CORS issues:**
- **Problema**: Browser blocca le richieste cross-origin
- **Soluzione**: Configurare CORS in Supabase

#### **E. SDK Supabase obsoleto:**
- **Problema**: Versioni incompatibili
- **Soluzione**: Aggiornare le dipendenze

---

## 📊 FASE 3: IMPLEMENTAZIONE

### 3.1 STEP BY STEP

#### **STEP 1: Backup sistema attuale**
```bash
# Commit del sistema BYPASS funzionante
git add .
git commit -m "Backup: Sistema BYPASS funzionante"
git push origin main
```

#### **STEP 2: Test configurazione**
- Eseguire tutti i test di connettività
- Verificare logs per errori
- Documentare problemi trovati

#### **STEP 3: Fix graduale**
- Correggere configurazione Supabase
- Aggiornare variabili d'ambiente
- Fix RLS policies
- Test dopo ogni modifica

#### **STEP 4: Test completo**
- Test login/logout
- Test dashboard
- Test navigazione
- Test tutte le funzionalità

#### **STEP 5: Rimozione BYPASS**
- Rimuovere codice BYPASS
- Implementare auth Supabase reale
- Test finale completo

---

## 📝 CHECKLIST DIAGNOSI

### ✅ CONFIGURAZIONE SUPABASE
- [ ] Project URL corretto
- [ ] Anon key valida
- [ ] Service role key valida
- [ ] Site URL configurato
- [ ] Redirect URLs configurati
- [ ] Email Auth abilitato

### ✅ VARIABILI D'AMBIENTE
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] Variabili su Vercel

### ✅ RLS POLICIES
- [ ] Policies per profiles
- [ ] Policies per orgs
- [ ] Policies per vehicles
- [ ] Policies per drivers
- [ ] Policies per transports
- [ ] Policies per clients

### ✅ LOGS E ERRORI
- [ ] Console browser pulita
- [ ] Network requests OK
- [ ] Supabase logs OK
- [ ] Vercel logs OK

### ✅ TEST CONNETTIVITÀ
- [ ] API Supabase risponde
- [ ] Auth endpoints funzionano
- [ ] Database queries OK
- [ ] Login test OK

---

## 🚀 PROSSIMI PASSI

1. **Raccogliere tutte le informazioni** della Fase 1
2. **Eseguire i test** di connettività
3. **Identificare il problema** specifico
4. **Implementare la soluzione** corretta
5. **Testare completamente** il sistema
6. **Rimuovere il BYPASS** temporaneo

---

## 📞 SUPPORTO

Se hai problemi con qualsiasi step, condividi:
- Screenshot della configurazione Supabase
- Logs degli errori
- Risultati dei test di connettività
- Configurazione variabili d'ambiente

**Iniziamo dalla Fase 1!** 🎯
