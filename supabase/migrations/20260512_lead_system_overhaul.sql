-- Migration: Lead System Overhaul
-- Created: 2026-05-12
--
-- Estende il sistema lead per supportare:
--  - Multi-quote sempre attive (versioning + flag is_active rimosso)
--  - Trial flessibili (unit days/weeks/months/years/unlimited)
--  - Attivazione manuale post-pagamento (flag auto_activate per quote)
--  - Audit trail completo (lead_activities)
--  - Accept/reject pubblico con audit IP/UA
--  - Lifecycle stage + scoring + UTM tracking
--  - Email campaigns on-demand (template + send manuale)

-- =====================================================
-- 1. ESTENSIONE TABELLA leads
-- =====================================================

ALTER TABLE leads
  -- Lifecycle & qualification
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'subscriber'
    CHECK (lifecycle_stage IN ('subscriber','mql','sql','opportunity','customer','evangelist','disqualified')),
  ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS lead_temperature TEXT CHECK (lead_temperature IN ('cold','warm','hot')),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Business sizing
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT CHECK (company_size IN ('1-5','6-20','21-50','51-200','200+')),
  ADD COLUMN IF NOT EXISTS vehicles_per_month INT,
  ADD COLUMN IF NOT EXISTS current_software TEXT,
  ADD COLUMN IF NOT EXISTS pain_points TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Attribution
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS referrer_url TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_contact_channel TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Engagement (denormalized for fast list view)
  ADD COLUMN IF NOT EXISTS last_email_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_email_clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_subscribed BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT,

  -- Sales pipeline
  ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_followup_action TEXT,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT CHECK (lost_reason IS NULL OR lost_reason IN
    ('price','competitor','timing','not_fit','no_response','features','other')),
  ADD COLUMN IF NOT EXISTS lost_to_competitor TEXT,
  ADD COLUMN IF NOT EXISTS expected_close_date DATE,
  ADD COLUMN IF NOT EXISTS expected_deal_value NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS probability_to_close INT CHECK (probability_to_close BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS decision_timeline TEXT CHECK (decision_timeline IS NULL OR decision_timeline IN
    ('immediate','this_month','this_quarter','this_year','exploring')),
  ADD COLUMN IF NOT EXISTS decision_makers JSONB DEFAULT '[]'::jsonb,

  -- Customer lifecycle (post conversione)
  ADD COLUMN IF NOT EXISTS ltv NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mrr_contribution NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS churn_risk_score INT,
  ADD COLUMN IF NOT EXISTS health_score INT,

  -- Custom fields
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_lifecycle ON leads(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

-- =====================================================
-- 2. ESTENSIONE TABELLA lead_quotes (multi-active + manual activation)
-- =====================================================

ALTER TABLE lead_quotes
  -- Versioning (multi-quote sempre attive)
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES lead_quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_title TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,

  -- Audit accept/reject
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acceptance_ip INET,
  ADD COLUMN IF NOT EXISTS acceptance_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_signature_data JSONB,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejection_ip INET,

  -- Engagement analytics
  ADD COLUMN IF NOT EXISTS viewed_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ,

  -- Approval workflow
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discount_reason TEXT,
  ADD COLUMN IF NOT EXISTS discount_approved_by UUID REFERENCES auth.users(id),

  -- Trial flessibile (legato a quote)
  ADD COLUMN IF NOT EXISTS trial_unit TEXT DEFAULT 'days'
    CHECK (trial_unit IN ('days','weeks','months','years','unlimited')),
  ADD COLUMN IF NOT EXISTS trial_quantity INT,
  ADD COLUMN IF NOT EXISTS trial_modules TEXT[],
  ADD COLUMN IF NOT EXISTS post_trial_action TEXT DEFAULT 'manual_activation'
    CHECK (post_trial_action IN ('auto_subscribe','notify_admin','manual_activation','lock')),

  -- Attivazione: il FLAG CHIAVE che chiedeva l'utente
  -- false = admin attiva manualmente dopo pagamento (default)
  -- true  = attivazione automatica al webhook Stripe
  ADD COLUMN IF NOT EXISTS auto_activate_on_payment BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS activation_pending BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS activation_notes TEXT,

  -- Stripe
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT,

  -- Pagamenti esterni (bonifico, contanti, assegno) registrati manualmente
  ADD COLUMN IF NOT EXISTS external_payment_method TEXT
    CHECK (external_payment_method IS NULL OR external_payment_method IN
      ('bank_transfer','cash','check','other_card','manual_free','offline')),
  ADD COLUMN IF NOT EXISTS external_payment_reference TEXT,  -- CRO bonifico, num. assegno, etc.
  ADD COLUMN IF NOT EXISTS external_payment_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS external_payment_date DATE,
  ADD COLUMN IF NOT EXISTS external_payment_notes TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_recorded_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS external_payment_recorded_at TIMESTAMPTZ,

  -- Allegati: PDF aggiuntivi, brochure, contratti, listini
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
    -- [{filename, storage_path, mime_type, size_bytes}]

  -- Setup avanzato
  ADD COLUMN IF NOT EXISTS setup_description TEXT,  -- cosa include il setup fee
  ADD COLUMN IF NOT EXISTS includes_onboarding BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_hours INT,
  ADD COLUMN IF NOT EXISTS includes_training BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS training_hours INT,
  ADD COLUMN IF NOT EXISTS includes_data_import BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sla_response_hours INT,

  -- Riferimento commerciale interno
  ADD COLUMN IF NOT EXISTS internal_reference TEXT,  -- es. "OPPORTUNITY-2026-Q2-042"
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2),  -- per agenti/referral
  ADD COLUMN IF NOT EXISTS commission_recipient UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_lead_quotes_lead_status ON lead_quotes(lead_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_pending_activation ON lead_quotes(activation_pending) WHERE activation_pending = TRUE;
CREATE INDEX IF NOT EXISTS idx_lead_quotes_parent ON lead_quotes(parent_quote_id);

-- Allarga enum status per supportare nuovi stati
ALTER TABLE lead_quotes DROP CONSTRAINT IF EXISTS lead_quotes_status_check;
ALTER TABLE lead_quotes ADD CONSTRAINT lead_quotes_status_check
  CHECK (status IN ('draft','pending_approval','sent','viewed','accepted','rejected','paid','pending_activation','activated','expired','cancelled','superseded'));

-- =====================================================
-- 3. LEAD ACTIVITIES (timeline unificata)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  -- es: email_sent, email_opened, email_clicked, quote_created, quote_sent, quote_viewed,
  --     quote_accepted, quote_rejected, payment_received, trial_started, trial_extended,
  --     trial_ended, account_activated, login, note_added, status_changed, tag_added, custom
  title TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_by_type TEXT DEFAULT 'staff' CHECK (performed_by_type IN ('staff','lead','system','automation')),
  related_quote_id UUID REFERENCES lead_quotes(id) ON DELETE SET NULL,
  related_demo_id UUID REFERENCES lead_demos(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, occurred_at DESC);
CREATE INDEX idx_lead_activities_type ON lead_activities(activity_type);

-- Trigger: aggiorna last_activity_at su leads quando inserita activity
CREATE OR REPLACE FUNCTION update_lead_last_activity() RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads SET last_activity_at = NEW.occurred_at WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_activities_touch ON lead_activities;
CREATE TRIGGER trg_lead_activities_touch
  AFTER INSERT ON lead_activities
  FOR EACH ROW EXECUTE FUNCTION update_lead_last_activity();

-- =====================================================
-- 4. EMAIL TEMPLATES & CAMPAIGNS
-- =====================================================
-- Drop versioni vecchie con schema diverso (verificato che sono vuote).
-- Se ci fossero dati la migration fallirebbe e andrebbe gestita a mano.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_campaigns') THEN
    IF NOT EXISTS (SELECT 1 FROM email_campaigns LIMIT 1) THEN
      DROP TABLE email_campaigns CASCADE;
    ELSE
      RAISE EXCEPTION 'email_campaigns ha dati esistenti — gestire manualmente lo schema';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_templates') THEN
    IF NOT EXISTS (SELECT 1 FROM email_templates LIMIT 1) THEN
      DROP TABLE email_templates CASCADE;
    ELSE
      RAISE EXCEPTION 'email_templates ha dati esistenti — gestire manualmente lo schema';
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL DEFAULT 'custom'
    CHECK (category IN ('welcome','quote','quote_reminder','trial_ending','trial_extended',
                        'activation','payment_received','followup','reactivation','custom')),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,  -- ['lead_name','quote_number',...]
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,  -- template di sistema non eliminabili
  created_by UUID REFERENCES auth.users(id),
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','queued','sent','delivered','opened','clicked','bounced','failed','cancelled')),
  to_email TEXT NOT NULL,
  cc_emails TEXT[],
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  custom_variables JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  resend_message_id TEXT,
  related_quote_id UUID REFERENCES lead_quotes(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_lead ON email_campaigns(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON email_campaigns(scheduled_at)
  WHERE status = 'scheduled';

-- =====================================================
-- 5. QUOTE TEMPLATES (preset riutilizzabili)
-- =====================================================

CREATE TABLE IF NOT EXISTS quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL,
  base_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
  special_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
  base_price NUMERIC(10,2),
  special_modules_price NUMERIC(10,2),
  setup_fee NUMERIC(10,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  contract_duration TEXT DEFAULT 'monthly',
  billing_frequency TEXT DEFAULT 'monthly',
  trial_unit TEXT,
  trial_quantity INT,
  default_terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. LEAD TASKS (promemoria)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  assigned_to UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_open ON lead_tasks(assigned_to, due_at)
  WHERE status IN ('open','in_progress');

-- =====================================================
-- 7. LEAD DOCUMENTS (contratti, allegati)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  document_type TEXT,  -- contract, durc, visura, identity, other
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead ON lead_documents(lead_id);

-- =====================================================
-- 8. ESTENSIONE lead_demos (trial unit flessibile + distinzione demo vs trial)
-- =====================================================

ALTER TABLE lead_demos
  ADD COLUMN IF NOT EXISTS trial_unit TEXT DEFAULT 'days'
    CHECK (trial_unit IN ('days','weeks','months','years','unlimited')),
  ADD COLUMN IF NOT EXISTS trial_quantity INT,
  ADD COLUMN IF NOT EXISTS grace_period_days INT DEFAULT 7,
  ADD COLUMN IF NOT EXISTS trial_extended_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_extend_on_engagement BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS conversion_offer_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS related_quote_id UUID REFERENCES lead_quotes(id) ON DELETE SET NULL,

  -- ★ Distinzione fondamentale showcase (dati finti) vs trial (account reale)
  ADD COLUMN IF NOT EXISTS demo_type TEXT DEFAULT 'trial'
    CHECK (demo_type IN ('showcase', 'trial', 'pilot')),
    -- showcase = ambiente con dati seed finti (~20 veicoli, clienti demo, trasporti)
    -- trial = account reale vuoto del cliente, dati propri, scadenza
    -- pilot = trial supervisionato con SLA e onboarding affiancato
  ADD COLUMN IF NOT EXISTS seed_data BOOLEAN DEFAULT FALSE,
    -- Solo per demo_type='showcase' o 'pilot': popola con dati realistici
  ADD COLUMN IF NOT EXISTS seed_profile TEXT,
    -- Quale profilo seed: 'autodemolitore_piccolo' | 'autodemolitore_grande' | 'officina' | 'flotta'
  ADD COLUMN IF NOT EXISTS access_email TEXT,
    -- email login: per showcase può essere demo+xxx@rescuemanager.eu, per trial = email lead
  ADD COLUMN IF NOT EXISTS access_password_set BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_in_marketing BOOLEAN DEFAULT FALSE,
    -- Se l'org demo è esposta nel sito (live demo pubblica)
  ADD COLUMN IF NOT EXISTS pilot_assigned_to UUID REFERENCES auth.users(id),
    -- Staff responsabile del pilot
  ADD COLUMN IF NOT EXISTS pilot_objectives TEXT,
    -- Obiettivi del pilot da raggiungere prima della conversione
  ADD COLUMN IF NOT EXISTS conversion_probability INT CHECK (conversion_probability BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_lead_demos_type ON lead_demos(demo_type, status);

-- Aggiorna esistenti: tutti i demo legacy come 'trial' (è quello che facevano)
UPDATE lead_demos SET demo_type = 'trial' WHERE demo_type IS NULL;

-- =====================================================
-- 9. SETTINGS GLOBALI AUTOMAZIONE
-- =====================================================
-- Memorizzato come riga singola in lead_automation_settings.
-- Default: TUTTO MANUALE (l'utente vuole controllo totale)

CREATE TABLE IF NOT EXISTS lead_automation_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  send_welcome_email_auto BOOLEAN DEFAULT FALSE,
  send_quote_reminder_auto BOOLEAN DEFAULT FALSE,
  create_org_on_payment_auto BOOLEAN DEFAULT FALSE,
  trial_expiry_notification_auto BOOLEAN DEFAULT TRUE,
  default_trial_unit TEXT DEFAULT 'days',
  default_trial_quantity INT DEFAULT 14,
  default_grace_period_days INT DEFAULT 7,
  send_quote_on_create BOOLEAN DEFAULT FALSE,
  notify_admin_on_payment BOOLEAN DEFAULT TRUE,
  notify_admin_on_quote_accepted BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO lead_automation_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Calcola scadenza trial da unit/quantity
CREATE OR REPLACE FUNCTION compute_trial_expiry(
  p_unit TEXT,
  p_quantity INT,
  p_start TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  IF p_unit = 'unlimited' THEN
    RETURN NULL;
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN NULL;
  END IF;
  RETURN CASE p_unit
    WHEN 'days'   THEN p_start + (p_quantity || ' days')::interval
    WHEN 'weeks'  THEN p_start + (p_quantity || ' weeks')::interval
    WHEN 'months' THEN p_start + (p_quantity || ' months')::interval
    WHEN 'years'  THEN p_start + (p_quantity || ' years')::interval
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Log activity helper (usata da trigger/endpoint)
CREATE OR REPLACE FUNCTION log_lead_activity(
  p_lead_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL,
  p_performed_by_type TEXT DEFAULT 'staff',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_related_quote_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO lead_activities (
    lead_id, activity_type, title, description,
    performed_by, performed_by_type, metadata, related_quote_id
  ) VALUES (
    p_lead_id, p_type, p_title, p_description,
    p_performed_by, p_performed_by_type, p_metadata, p_related_quote_id
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. SEED TEMPLATE EMAIL DI SISTEMA
-- =====================================================

INSERT INTO email_templates (slug, name, category, subject, body_html, body_text, is_system, variables)
VALUES
  ('quote_sent', 'Invio Preventivo', 'quote',
   'Il tuo preventivo RescueManager — {{quote_number}}',
   '<p>Ciao {{lead_name}},</p><p>in allegato trovi il preventivo <b>{{quote_number}}</b>.</p><p>Puoi visualizzarlo e accettarlo qui: <a href="{{quote_url}}">{{quote_url}}</a></p>',
   'Ciao {{lead_name}}, in allegato il preventivo {{quote_number}}. Link: {{quote_url}}',
   TRUE,
   '["lead_name","quote_number","quote_url","quote_total"]'::jsonb),

  ('quote_reminder', 'Promemoria Preventivo', 'quote_reminder',
   'Promemoria — Preventivo {{quote_number}} in scadenza',
   '<p>Ciao {{lead_name}},</p><p>ti ricordiamo che il preventivo <b>{{quote_number}}</b> scade il <b>{{expiry_date}}</b>.</p><p><a href="{{quote_url}}">Visualizza preventivo</a></p>',
   'Ciao {{lead_name}}, preventivo {{quote_number}} scade il {{expiry_date}}. Link: {{quote_url}}',
   TRUE,
   '["lead_name","quote_number","quote_url","expiry_date"]'::jsonb),

  ('account_activated', 'Account Attivato', 'activation',
   'Benvenuto in RescueManager — Account attivato',
   '<p>Ciao {{lead_name}},</p><p>il tuo account è stato attivato.</p><p>Imposta la password: <a href="{{setup_password_url}}">{{setup_password_url}}</a></p>',
   'Ciao {{lead_name}}, account attivato. Setup password: {{setup_password_url}}',
   TRUE,
   '["lead_name","setup_password_url","plan_type"]'::jsonb),

  ('trial_ending', 'Trial in scadenza', 'trial_ending',
   'Il tuo trial RescueManager sta per scadere',
   '<p>Ciao {{lead_name}},</p><p>il trial scade il <b>{{trial_expiry}}</b>. Vuoi continuare?</p>',
   'Ciao {{lead_name}}, trial scade il {{trial_expiry}}.',
   TRUE,
   '["lead_name","trial_expiry"]'::jsonb),

  ('payment_received', 'Pagamento Ricevuto', 'payment_received',
   'Pagamento ricevuto — In attesa di attivazione',
   '<p>Ciao {{lead_name}},</p><p>abbiamo ricevuto il pagamento. Un nostro operatore attiverà a breve il tuo account e ti contatterà.</p>',
   'Pagamento ricevuto. Attivazione in corso.',
   TRUE,
   '["lead_name","quote_number"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;
