-- Migration: Appuntamenti + Follow-up + Primo contatto
-- Created: 2026-05-13
--
-- Sistema appuntamenti IN-HOUSE: pagina pubblica /appointment/:uuid
-- per autoselezione slot (alternativa a Calendly).
-- Schema allineato a moduli/lead-api/routes/appointments.js

-- =====================================================
-- 1. leads: primo contatto manuale
-- =====================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_contact_method TEXT
    CHECK (first_contact_method IS NULL OR first_contact_method IN
      ('phone','email','whatsapp','in_person','referral','web_form','social','fair','other')),
  ADD COLUMN IF NOT EXISTS first_contact_notes TEXT,
  ADD COLUMN IF NOT EXISTS first_contact_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN leads.first_contact_at IS 'Quando avvenuto il primo contatto reale (anche pre-app)';

-- =====================================================
-- 2. lead_automation_settings: booking defaults + follow-up
-- =====================================================

ALTER TABLE lead_automation_settings
  ADD COLUMN IF NOT EXISTS calendly_url TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_book_url TEXT,
  ADD COLUMN IF NOT EXISTS default_followup_after_quote_days INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS default_followup_after_demo_days INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS default_followup_after_no_response_days INT DEFAULT 7,
  ADD COLUMN IF NOT EXISTS appointment_duration_default_minutes INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS appointment_buffer_minutes INT DEFAULT 15,
  ADD COLUMN IF NOT EXISTS booking_hours_start TIME DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS booking_hours_end TIME DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS booking_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri'];

-- =====================================================
-- 3. lead_appointments  (sistema in-house con pagina pubblica)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  public_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,

  -- Tipo
  appointment_type TEXT NOT NULL DEFAULT 'discovery_call'
    CHECK (appointment_type IN ('discovery_call','demo_call','follow_up','onboarding','negotiation','contract_signing','training','custom')),
  title TEXT NOT NULL,
  description TEXT,

  -- Durata & finestra
  duration_minutes INT DEFAULT 30,
  proposed_slots JSONB DEFAULT '[]'::jsonb,
    -- Array di slot suggeriti: [{start:'iso', end:'iso'}, ...]
  scheduled_at TIMESTAMPTZ,           -- slot scelto
  scheduled_until TIMESTAMPTZ,
  booking_window_start TIMESTAMPTZ,   -- finestra entro cui il lead può scegliere
  booking_window_end TIMESTAMPTZ,
  booking_hours_start TIME,           -- override orari per questo appuntamento
  booking_hours_end TIME,
  booking_buffer_minutes INT,

  -- Modalità
  meeting_mode TEXT DEFAULT 'video'
    CHECK (meeting_mode IN ('video','phone','in_person','hybrid')),
  meeting_url TEXT,
  meeting_phone TEXT,
  meeting_address TEXT,

  -- Stato
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','confirmed','rescheduled','completed','no_show','cancelled')),
  rescheduled_count INT DEFAULT 0,

  -- Audit lead confirmation
  confirmed_by_lead_at TIMESTAMPTZ,
  confirmation_ip INET,
  confirmation_user_agent TEXT,

  -- Cancellazione
  cancellation_reason TEXT,

  -- Reminder
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  reminder_24h_at TIMESTAMPTZ,
  reminder_1h_at TIMESTAMPTZ,

  -- Esito post meeting
  meeting_notes TEXT,
  outcome TEXT CHECK (outcome IS NULL OR outcome IN
    ('positive','neutral','negative','needs_followup','lost','converted')),
  next_steps TEXT,

  -- Riferimenti
  related_quote_id UUID REFERENCES lead_quotes(id) ON DELETE SET NULL,
  related_demo_id UUID REFERENCES lead_demos(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id),

  -- External integrations (futuro Google/Outlook)
  external_provider TEXT,             -- 'google'|'outlook'|'calendly'
  external_event_id TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_appointments_lead ON lead_appointments(lead_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_appointments_status ON lead_appointments(status);
CREATE INDEX IF NOT EXISTS idx_lead_appointments_upcoming ON lead_appointments(scheduled_at)
  WHERE status IN ('proposed','confirmed','rescheduled') AND scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_appointments_assigned ON lead_appointments(assigned_to, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lead_appointments_public_uuid ON lead_appointments(public_uuid);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION touch_lead_appointment() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_appointment_touch ON lead_appointments;
CREATE TRIGGER trg_lead_appointment_touch
  BEFORE UPDATE ON lead_appointments
  FOR EACH ROW EXECUTE FUNCTION touch_lead_appointment();

-- =====================================================
-- 4. SEED template email (booking + reminder)
-- =====================================================

INSERT INTO email_templates (slug, name, category, subject, body_html, body_text, is_system, variables)
VALUES
  ('appointment_booking_link', 'Invio link prenotazione', 'custom',
   'Prenota la tua demo RescueManager',
   '<p>Ciao {{lead_name}},</p><p>scegli quando ti fa comodo per {{appointment_type_label}} cliccando qui:<br><a href="{{booking_url}}">{{booking_url}}</a></p><p>Durata circa {{duration}} minuti.</p>',
   'Ciao {{lead_name}}, prenota qui: {{booking_url}} (durata {{duration}} min)',
   TRUE,
   '["lead_name","booking_url","duration","appointment_type_label"]'::jsonb),

  ('appointment_confirmation', 'Conferma appuntamento', 'custom',
   'Appuntamento confermato — {{appointment_date}} ore {{appointment_time}}',
   '<p>Ciao {{lead_name}},</p><p>il tuo appuntamento <b>{{appointment_title}}</b> è confermato.</p><p>📅 {{appointment_date}}<br>🕒 {{appointment_time}}<br>⏱ {{duration}} min</p><p>{{meeting_link_or_location}}</p><p>Trovi il file .ics in allegato per aggiungerlo al calendario.</p>',
   'Appuntamento confermato {{appointment_date}} {{appointment_time}}. {{meeting_link_or_location}}',
   TRUE,
   '["lead_name","appointment_title","appointment_date","appointment_time","duration","meeting_link_or_location"]'::jsonb),

  ('appointment_reminder_24h', 'Promemoria 24h', 'custom',
   'Promemoria: appuntamento domani alle {{appointment_time}}',
   '<p>Ciao {{lead_name}},</p><p>ti ricordiamo l''appuntamento di domani <b>{{appointment_date}}</b> alle <b>{{appointment_time}}</b>.</p><p>{{meeting_link_or_location}}</p>',
   'Promemoria appuntamento domani {{appointment_date}} {{appointment_time}}',
   TRUE,
   '["lead_name","appointment_date","appointment_time","meeting_link_or_location"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;
