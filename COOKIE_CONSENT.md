# 🍪 Sistema Cookie Consent - Documentazione

Sistema completo di gestione cookie consent conforme a **GDPR** (Reg. UE 2016/679) e **Provvedimento Garante n. 231/2021**.

## ✅ Funzionalità Implementate

### 1. **Banner Cookie Iniziale**
- Appare al primo accesso se l'utente non ha ancora dato consenso
- 3 opzioni: "Accetta Tutti", "Solo Essenziali", "Personalizza"
- Design conforme: pulsanti di pari rilievo grafico
- Privacy by default: nessun cookie non essenziale prima del consenso

### 2. **Gestione Preferenze (Bottone in Basso a Sinistra)**
- Bottone fisso in basso a sinistra dopo il primo consenso
- Permette di modificare le preferenze in qualsiasi momento
- 4 categorie: Essenziali, Analytics, Funzionali, Marketing

### 3. **Salvataggio Consenso**
- **localStorage**: Preferenze salvate localmente per persistenza
- **Database Supabase**: Audit trail completo per conformità GDPR
  - User ID (se autenticato)
  - Session ID univoco
  - IP mascherato (ultimo ottetto rimosso)
  - User agent
  - Timestamp
  - Versione cookie policy

### 4. **Caricamento Condizionale Script**
- **Google Analytics 4**: Solo se `analytics = true`
  - IP anonimizzato automaticamente
  - Cookie SameSite=None;Secure
- **Meta Pixel**: Solo se `marketing = true`
- **Hotjar**: Solo se `analytics = true`
- **Ricarica automatica** quando l'utente modifica le preferenze

## 📁 File Creati/Modificati

### Nuovi File
```
website/
├── src/
│   ├── hooks/
│   │   └── useCookieConsent.ts          # Hook per gestione stato consenso
│   └── components/
│       ├── CookieSettingsButton.tsx     # Bottone basso sinistra
│       └── ConditionalScripts.tsx       # Caricamento script condizionale
├── supabase/migrations/
│   └── 20260319_cookie_consents.sql     # Tabella audit consensi
└── .env.example                          # Variabili ambiente documentate
```

### File Modificati
```
website/src/
├── app/layout.tsx                        # Integrazione componenti
└── components/CookieConsentModal.tsx     # Aggiornato per usare hook
```

## 🗄️ Database Schema

```sql
CREATE TABLE cookie_consents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  session_id text NOT NULL,
  essential boolean DEFAULT true,
  analytics boolean DEFAULT false,
  functional boolean DEFAULT false,
  marketing boolean DEFAULT false,
  ip_address inet,              -- IP mascherato
  user_agent text,
  consent_version text,
  created_at timestamptz,
  updated_at timestamptz
);
```

## 🚀 Setup

### 1. Applica Migrazione Database
```bash
cd supabase
supabase db push
```

Oppure manualmente su Supabase Dashboard:
1. Vai su SQL Editor
2. Copia contenuto di `migrations/20260319_cookie_consents.sql`
3. Esegui

### 2. Configura Google Analytics (Opzionale)

**Ottieni GA4 Measurement ID:**
1. Vai su https://analytics.google.com
2. Crea proprietà GA4
3. Copia Measurement ID (formato: `G-XXXXXXXXXX`)

**Aggiungi a `.env.local`:**
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Configura Altri Servizi (Opzionale)

**Meta Pixel:**
```env
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
```

**Hotjar:**
```env
NEXT_PUBLIC_HOTJAR_ID=1234567
```

## 🎯 Come Funziona

### Flusso Utente Nuovo
1. Utente visita sito → Banner appare dopo 600ms
2. Utente clicca "Accetta Tutti" → Consenso salvato
3. Script analytics caricati immediatamente
4. Bottone "Cookie" appare in basso a sinistra

### Flusso Modifica Preferenze
1. Utente clicca bottone "Cookie" (basso sinistra)
2. Modal con toggle per ogni categoria
3. Utente modifica e salva
4. Pagina ricarica per applicare nuove preferenze
5. Nuovo consenso salvato su DB

### Privacy by Default
- ✅ Cookie essenziali: **sempre attivi** (autenticazione, sicurezza)
- ❌ Cookie analytics: **disabilitati** fino a consenso
- ❌ Cookie funzionali: **disabilitati** fino a consenso
- ❌ Cookie marketing: **disabilitati** fino a consenso

## 📊 Audit GDPR

### Visualizzare Consensi Salvati
```sql
-- Tutti i consensi
SELECT * FROM cookie_consents ORDER BY created_at DESC;

-- Consensi per utente specifico
SELECT * FROM cookie_consents 
WHERE user_id = 'uuid-utente'
ORDER BY created_at DESC;

-- Statistiche consensi
SELECT 
  COUNT(*) as totale,
  SUM(CASE WHEN analytics THEN 1 ELSE 0 END) as analytics_accepted,
  SUM(CASE WHEN marketing THEN 1 ELSE 0 END) as marketing_accepted
FROM cookie_consents;
```

### Esportare per Audit
```sql
-- Export CSV per audit GDPR
COPY (
  SELECT 
    session_id,
    user_id,
    essential,
    analytics,
    functional,
    marketing,
    ip_address,
    consent_version,
    created_at
  FROM cookie_consents
  WHERE created_at >= NOW() - INTERVAL '1 year'
) TO '/tmp/cookie_consents_audit.csv' WITH CSV HEADER;
```

## 🔒 Conformità GDPR

### ✅ Requisiti Soddisfatti

- [x] **Art. 7 GDPR**: Consenso libero, specifico, informato, inequivocabile
- [x] **Art. 13 GDPR**: Informativa completa (Cookie Policy)
- [x] **Art. 25 GDPR**: Privacy by default (nessun cookie prima del consenso)
- [x] **Provv. 231/2021**: Banner con pulsanti paritetici
- [x] **IP anonimizzato**: Google Analytics con `anonymize_ip: true`
- [x] **Audit trail**: Tutti i consensi tracciati su database
- [x] **Revoca facile**: Bottone sempre accessibile per modificare

### 📋 Cookie Policy
Assicurati che la tua Cookie Policy (`/cookie-policy`) sia aggiornata con:
- Elenco cookie utilizzati
- Finalità di ciascun cookie
- Durata conservazione
- Come revocare il consenso

## 🧪 Test

### Test Manuale
1. **Primo accesso**: Banner appare
2. **Accetta tutti**: Script GA4 caricato (verifica console)
3. **Ricarica pagina**: Banner non appare più
4. **Click bottone Cookie**: Modal preferenze apre
5. **Disabilita analytics**: Salva → Pagina ricarica → GA4 non caricato
6. **Verifica DB**: Controlla tabella `cookie_consents`

### Test Console Browser
```javascript
// Verifica consenso salvato
localStorage.getItem('cookie-consent')

// Verifica session ID
localStorage.getItem('cookie-session-id')

// Forza reset (per testare)
localStorage.removeItem('cookie-consent')
location.reload()
```

## 🎨 Personalizzazione

### Cambiare Posizione Bottone
Modifica `CookieSettingsButton.tsx`:
```tsx
// Basso destra invece di sinistra
className="fixed bottom-6 right-6 ..."
```

### Aggiungere Altri Script
Modifica `ConditionalScripts.tsx`:
```tsx
{preferences.analytics && (
  <Script id="custom-analytics">
    {`// Il tuo script qui`}
  </Script>
)}
```

## 📞 Supporto

Per domande o problemi:
- Documentazione GDPR: https://gdpr.eu
- Provvedimento Garante: https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876

---

**Implementato il**: 19 Marzo 2026  
**Versione Cookie Policy**: 1.0  
**Conforme a**: GDPR (UE 2016/679), D.Lgs. 196/2003, Provv. Garante 231/2021
