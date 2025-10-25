# 📊 SUPABASE SCHEMA COMPLETO

## 🗄️ **SCHEMA DATABASE RESCUEMANAGER**

Questo documento contiene lo schema completo del database Supabase per RescueManager.

### **📋 TABELLE PRINCIPALI**

#### **🔐 AUTENTICAZIONE**
- `auth.users` - Utenti Supabase
- `public.profiles` - Profili utenti estesi
- `public.oauth_codes` - Codici OAuth temporanei
- `public.oauth_tokens` - Token OAuth persistenti

#### **🏢 ORGANIZZAZIONI**
- `public.orgs` - Organizzazioni
- `public.org_members` - Membri organizzazione
- `public.org_settings` - Impostazioni organizzazione
- `public.org_subscriptions` - Abbonamenti organizzazione

#### **👥 UTENTI E STAFF**
- `public.users` - Utenti interni
- `public.staff_drivers` - Autisti staff
- `public.staff_vehicles` - Veicoli staff
- `public.user_sessions` - Sessioni utente
- `public.user_2fa_settings` - Impostazioni 2FA
- `public.user_notification_settings` - Notifiche utente

#### **🚗 VEICOLI E TRASPORTI**
- `public.vehicles` - Veicoli
- `public.vehicles_catalog` - Catalogo veicoli
- `public.transports` - Trasporti
- `public.drivers` - Autisti
- `public.demolition_cases` - Casi demolizione

#### **📦 RICAMBI E INVENTARIO**
- `public.spare_parts` - Ricambi
- `public.spare_parts_catalog` - Catalogo ricambi
- `public.spare_parts_categories` - Categorie ricambi
- `public.spare_parts_compatibility` - Compatibilità ricambi
- `public.external_parts_cache` - Cache ricambi esterni

#### **💰 FATTURAZIONE**
- `public.invoices` - Fatture
- `public.invoice_items` - Voci fattura
- `public.invoice_due` - Scadenze fatture
- `public.billing_providers` - Provider fatturazione
- `public.org_billing_connections` - Connessioni billing
- `public.subscriptions` - Abbonamenti utenti

#### **📋 GESTIONE**
- `public.clients` - Clienti
- `public.quotes` - Preventivi
- `public.quote_presets` - Preset preventivi
- `public.ddt` - DDT
- `public.ddt_items` - Voci DDT
- `public.categories` - Categorie
- `public.leads` - Lead

#### **🔍 RICONOSCIMENTO**
- `public.barcode_lookup` - Ricerca codici a barre
- `public.recognition_logs` - Log riconoscimento

#### **🏛️ GESTIONE PATRIMONIO**
- `public.yard_items` - Elementi deposito
- `public.assistance_requests` - Richieste assistenza

#### **🔗 INTEGRAZIONI**
- `public.rvfu_*` - Tabelle RVFU
- `public.sdi_events` - Eventi SDI
- `public.outbox_emails` - Email in uscita

### **🔐 TABELLE OAUTH (DESKTOP APP)**

```sql
-- Codici OAuth temporanei
CREATE TABLE public.oauth_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  app_id text NOT NULL,
  redirect_uri text NOT NULL,
  state text,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT oauth_codes_pkey PRIMARY KEY (id),
  CONSTRAINT oauth_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Token OAuth persistenti
CREATE TABLE public.oauth_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id text NOT NULL,
  access_token text NOT NULL UNIQUE,
  refresh_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  scope text DEFAULT 'read write'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT oauth_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT oauth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

### **📊 STATISTICHE SCHEMA**

- **Totale tabelle**: ~50 tabelle
- **Tabelle OAuth**: ✅ Presenti
- **RLS**: Attivo su tutte le tabelle
- **Indici**: Ottimizzati per performance
- **Foreign Keys**: Relazioni complete

### **🚀 STATO IMPLEMENTAZIONE**

- ✅ **Database**: Schema completo
- ✅ **OAuth Tables**: Presenti e funzionanti
- ✅ **RLS Policies**: Configurate
- ✅ **Indici**: Ottimizzati
- ✅ **Foreign Keys**: Relazioni valide

### **📝 NOTE TECNICHE**

1. **UUID**: Tutte le chiavi primarie usano UUID
2. **Timestamps**: `created_at` e `updated_at` automatici
3. **JSONB**: Dati strutturati in formato JSON
4. **Constraints**: Validazioni a livello database
5. **RLS**: Sicurezza a livello riga attiva

---

**Ultimo aggiornamento**: 24 Dicembre 2024  
**Versione**: 1.0  
**Database**: Supabase PostgreSQL
