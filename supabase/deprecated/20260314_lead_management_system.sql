-- Migration: Lead Management System (Demo, Quotes, Conversione)
-- Created: 2026-03-14
-- Description: Tabelle per gestione lead, demo account, preventivi e conversione clienti

-- =====================================================
-- 1. AGGIORNA TABELLA ORGS (Demo Mode)
-- =====================================================

ALTER TABLE orgs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS web_access_enabled BOOLEAN DEFAULT true;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS web_features TEXT[] DEFAULT ARRAY['all'];
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS desktop_access_enabled BOOLEAN DEFAULT true;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS desktop_modules TEXT[] DEFAULT ARRAY['trasporti', 'tracking', 'calendario', 'clienti', 'mezzi', 'piazzale', 'autisti', 'ricambi', 'preventivi', 'report'];
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID REFERENCES leads(id);

COMMENT ON COLUMN orgs.is_demo IS 'True se account demo, false se produzione';
COMMENT ON COLUMN orgs.demo_expires_at IS 'Data scadenza demo (NULL se produzione)';
COMMENT ON COLUMN orgs.web_access_enabled IS 'Abilita accesso area personale website';
COMMENT ON COLUMN orgs.web_features IS 'Feature area personale: all, quotes_view, billing, settings';
COMMENT ON COLUMN orgs.desktop_access_enabled IS 'Abilita accesso desktop app';
COMMENT ON COLUMN orgs.desktop_modules IS 'Moduli desktop app abilitati';

-- =====================================================
-- 2. AGGIORNA TABELLA LEADS (Demo Tracking + Nuovi Status)
-- =====================================================

-- Aggiorna CHECK constraint per nuovi status
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'demo_active'::text, 'quote_sent'::text, 'converted'::text, 'lost'::text]));

-- Rendi email nullable (alcuni lead potrebbero non avere email)
ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS demo_account_id UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS demo_org_id UUID REFERENCES orgs(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS demo_modules TEXT[];

COMMENT ON COLUMN leads.demo_account_id IS 'ID account demo creato per questo lead';
COMMENT ON COLUMN leads.demo_org_id IS 'ID organizzazione demo creata per questo lead';
COMMENT ON COLUMN leads.demo_expires_at IS 'Data scadenza demo';
COMMENT ON COLUMN leads.demo_modules IS 'Moduli attivati in demo';

-- =====================================================
-- 3. TABELLA LEAD_QUOTES (Preventivi)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  quote_number TEXT UNIQUE NOT NULL,
  
  -- Piano e moduli
  plan_type TEXT CHECK (plan_type IN ('starter', 'flotta', 'enterprise', 'custom')),
  base_modules TEXT[] DEFAULT ARRAY['trasporti', 'tracking', 'calendario', 'clienti', 'mezzi', 'piazzale', 'autisti', 'ricambi', 'preventivi', 'report'],
  special_modules TEXT[], -- ['rvfu', 'rentri', 'fatturazione']
  customizations TEXT,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  special_modules_price DECIMAL(10, 2) DEFAULT 0,
  customizations_price DECIMAL(10, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  monthly_total DECIMAL(10, 2) NOT NULL,
  yearly_total DECIMAL(10, 2),
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Pricing custom (se staff modifica prezzi)
  custom_base_price DECIMAL(10, 2),
  custom_rvfu_price DECIMAL(10, 2),
  custom_rentri_price DECIMAL(10, 2),
  custom_fatturazione_price DECIMAL(10, 2),
  
  -- Condizioni
  contract_duration TEXT CHECK (contract_duration IN ('monthly', 'yearly', 'biennial')),
  payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'sepa')),
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly')),
  special_terms TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'paid', 'rejected', 'expired')) DEFAULT 'draft',
  public_uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  
  -- Date
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- PDF
  pdf_url TEXT,
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_lead_quotes_lead_id ON lead_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_public_uuid ON lead_quotes(public_uuid);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_status ON lead_quotes(status);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_expiry_date ON lead_quotes(expiry_date);

-- Trigger updated_at
CREATE TRIGGER update_lead_quotes_updated_at
  BEFORE UPDATE ON lead_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lead_quotes IS 'Preventivi inviati ai lead';

-- =====================================================
-- 4. TABELLA LEAD_QUOTE_MODIFICATIONS (Richieste Modifiche)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_quote_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES lead_quotes(id) ON DELETE CASCADE,
  requested_by TEXT CHECK (requested_by IN ('client', 'staff')) NOT NULL,
  modification_text TEXT NOT NULL,
  modules_to_add TEXT[],
  modules_to_remove TEXT[],
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_quote_modifications_quote_id ON lead_quote_modifications(quote_id);
CREATE INDEX IF NOT EXISTS idx_lead_quote_modifications_status ON lead_quote_modifications(status);

COMMENT ON TABLE lead_quote_modifications IS 'Richieste di modifica preventivi da parte di clienti o staff';

-- =====================================================
-- 5. TABELLA LEAD_DEMOS (Demo Account Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  demo_account_id UUID REFERENCES auth.users(id),
  demo_org_id UUID REFERENCES orgs(id),
  
  -- Configurazione
  duration_days INTEGER DEFAULT 7,
  modules_enabled TEXT[] NOT NULL,
  sample_data_loaded BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'expired', 'converted', 'cancelled')) DEFAULT 'active',
  
  -- Date
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_login_at TIMESTAMPTZ,
  
  -- Metriche utilizzo
  login_count INTEGER DEFAULT 0,
  modules_used TEXT[],
  data_created JSONB DEFAULT '{}', -- {clients: 5, transports: 10, ...}
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_demos_lead_id ON lead_demos(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_demos_demo_org_id ON lead_demos(demo_org_id);
CREATE INDEX IF NOT EXISTS idx_lead_demos_expires_at ON lead_demos(expires_at);
CREATE INDEX IF NOT EXISTS idx_lead_demos_status ON lead_demos(status);

CREATE TRIGGER update_lead_demos_updated_at
  BEFORE UPDATE ON lead_demos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lead_demos IS 'Tracking demo account attivati per lead';

-- =====================================================
-- 6. AGGIORNA TABELLE PRINCIPALI (Flag is_demo)
-- =====================================================

-- Transports
ALTER TABLE transports ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_transports_org_demo ON transports(org_id, is_demo);
COMMENT ON COLUMN transports.is_demo IS 'True se dato creato in demo mode';

-- Clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_clients_org_demo ON clients(org_id, is_demo);
COMMENT ON COLUMN clients.is_demo IS 'True se dato creato in demo mode';

-- Vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_vehicles_org_demo ON vehicles(org_id, is_demo);
COMMENT ON COLUMN vehicles.is_demo IS 'True se dato creato in demo mode';

-- Drivers (se esiste)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'drivers') THEN
    ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_drivers_org_demo ON drivers(org_id, is_demo);
  END IF;
END $$;

-- Quotes (preventivi interni app)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') THEN
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_quotes_org_demo ON quotes(org_id, is_demo);
  END IF;
END $$;

-- =====================================================
-- 7. FUNCTION: Check Demo Expiry (Blocca Scritture)
-- =====================================================

CREATE OR REPLACE FUNCTION check_demo_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se org è in demo mode
  IF (SELECT is_demo FROM orgs WHERE id = NEW.org_id) THEN
    -- Verifica se demo è scaduta
    IF (SELECT demo_expires_at FROM orgs WHERE id = NEW.org_id) < NOW() THEN
      RAISE EXCEPTION 'Demo account expired. Cannot modify data. Please upgrade to continue.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_demo_expiry IS 'Impedisce modifiche dati quando demo è scaduta';

-- =====================================================
-- 8. TRIGGER: Blocca Scritture Demo Scadute
-- =====================================================

-- Transports
DROP TRIGGER IF EXISTS prevent_demo_write_after_expiry_transports ON transports;
CREATE TRIGGER prevent_demo_write_after_expiry_transports
  BEFORE INSERT OR UPDATE ON transports
  FOR EACH ROW
  EXECUTE FUNCTION check_demo_expiry();

-- Clients
DROP TRIGGER IF EXISTS prevent_demo_write_after_expiry_clients ON clients;
CREATE TRIGGER prevent_demo_write_after_expiry_clients
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION check_demo_expiry();

-- Vehicles
DROP TRIGGER IF EXISTS prevent_demo_write_after_expiry_vehicles ON vehicles;
CREATE TRIGGER prevent_demo_write_after_expiry_vehicles
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION check_demo_expiry();

-- =====================================================
-- 9. FUNCTION: Auto-set is_demo Flag
-- =====================================================

CREATE OR REPLACE FUNCTION auto_set_is_demo()
RETURNS TRIGGER AS $$
BEGIN
  -- Imposta is_demo automaticamente basandosi su org
  NEW.is_demo := (SELECT is_demo FROM orgs WHERE id = NEW.org_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_set_is_demo IS 'Imposta automaticamente flag is_demo basandosi su org';

-- =====================================================
-- 10. TRIGGER: Auto-set is_demo su Insert
-- =====================================================

-- Transports
DROP TRIGGER IF EXISTS auto_set_is_demo_transports ON transports;
CREATE TRIGGER auto_set_is_demo_transports
  BEFORE INSERT ON transports
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_is_demo();

-- Clients
DROP TRIGGER IF EXISTS auto_set_is_demo_clients ON clients;
CREATE TRIGGER auto_set_is_demo_clients
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_is_demo();

-- Vehicles
DROP TRIGGER IF EXISTS auto_set_is_demo_vehicles ON vehicles;
CREATE TRIGGER auto_set_is_demo_vehicles
  BEFORE INSERT ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_is_demo();

-- =====================================================
-- 11. RLS POLICIES (Isolamento Demo/Produzione)
-- =====================================================

-- Policy per transports: vedi solo dati del tuo tipo (demo o produzione)
DROP POLICY IF EXISTS demo_data_isolation_transports ON transports;
CREATE POLICY demo_data_isolation_transports ON transports
  USING (
    -- Se org è demo, vedi solo dati demo
    -- Se org è produzione, vedi solo dati produzione
    is_demo = (SELECT is_demo FROM orgs WHERE id = org_id)
  );

-- Policy per clients
DROP POLICY IF EXISTS demo_data_isolation_clients ON clients;
CREATE POLICY demo_data_isolation_clients ON clients
  USING (
    is_demo = (SELECT is_demo FROM orgs WHERE id = org_id)
  );

-- Policy per vehicles
DROP POLICY IF EXISTS demo_data_isolation_vehicles ON vehicles;
CREATE POLICY demo_data_isolation_vehicles ON vehicles
  USING (
    is_demo = (SELECT is_demo FROM orgs WHERE id = org_id)
  );

-- =====================================================
-- 12. FUNCTION: Generate Quote Number
-- =====================================================

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  month TEXT;
  counter INTEGER;
  quote_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  month := TO_CHAR(NOW(), 'MM');
  
  -- Conta preventivi del mese corrente
  SELECT COUNT(*) + 1 INTO counter
  FROM lead_quotes
  WHERE quote_number LIKE 'QUOTE-' || year || month || '-%';
  
  quote_num := 'QUOTE-' || year || month || '-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_quote_number IS 'Genera numero preventivo progressivo (QUOTE-YYYYMM-NNN)';

-- =====================================================
-- 13. FUNCTION: Expire Demo Accounts (Cron Job)
-- =====================================================

CREATE OR REPLACE FUNCTION expire_demo_accounts()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  count INTEGER := 0;
BEGIN
  -- Aggiorna status demo scadute
  UPDATE lead_demos
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS count = ROW_COUNT;
  
  -- Disabilita accesso desktop app per org demo scadute
  UPDATE orgs
  SET desktop_access_enabled = false
  WHERE is_demo = true
    AND demo_expires_at < NOW()
    AND desktop_access_enabled = true;
  
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_demo_accounts IS 'Scade demo account automaticamente (da eseguire con cron)';

-- =====================================================
-- 14. FUNCTION: Expire Quotes (Cron Job)
-- =====================================================

CREATE OR REPLACE FUNCTION expire_quotes()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  count INTEGER := 0;
BEGIN
  -- Aggiorna status preventivi scaduti
  UPDATE lead_quotes
  SET status = 'expired'
  WHERE status IN ('sent', 'viewed')
    AND expiry_date < CURRENT_DATE;
  
  GET DIAGNOSTICS count = ROW_COUNT;
  
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_quotes IS 'Scade preventivi automaticamente (da eseguire con cron)';

-- =====================================================
-- 15. TABELLA LEAD_MESSAGES (Chat Staff↔Lead)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  subject TEXT,
  body TEXT NOT NULL,
  sent_by_staff_id UUID REFERENCES auth.users(id),
  sent_by_name TEXT,
  read_at TIMESTAMPTZ,
  email_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_created_at ON lead_messages(created_at DESC);

COMMENT ON TABLE lead_messages IS 'Messaggi tra staff e lead (outgoing=staff→lead, incoming=lead→staff)';

GRANT ALL ON lead_messages TO authenticated;
GRANT ALL ON lead_messages TO service_role;

-- =====================================================
-- 16. GRANT PERMISSIONS
-- =====================================================

-- Grant su tabelle nuove
GRANT ALL ON lead_quotes TO authenticated;
GRANT ALL ON lead_quote_modifications TO authenticated;
GRANT ALL ON lead_demos TO authenticated;

-- Grant su funzioni
GRANT EXECUTE ON FUNCTION generate_quote_number TO authenticated;
GRANT EXECUTE ON FUNCTION expire_demo_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION expire_quotes TO authenticated;
