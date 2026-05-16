-- Migration: Sistema Supporto Clienti (ticketing)
-- Created: 2026-05-16
--
-- Sistema di supporto clienti unificato, distinto da `assistance_requests`
-- (quest'ultima = soccorso stradale con condivisione posizione GPS del cliente).
--
-- Tabelle:
--  - support_tickets   : ticket aperti dai clienti loggati
--  - ticket_messages   : thread di messaggi cliente <-> staff
--
-- Email collegata: supporto@rescuemanager.eu (notifiche via Resend lato API).
-- RLS: cliente vede i propri ticket / quelli della propria org; staff vede tutto.

-- =====================================================
-- 1. support_tickets
-- =====================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email  TEXT NOT NULL,
  customer_name   TEXT,
  subject         TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'domanda'
                    CHECK (category IN ('domanda','bug','funzionalita','fatturazione','altro')),
  priority        TEXT NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low','normal','high','urgent')),
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','pending','in_progress','resolved','closed')),
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org      ON public.support_tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_creator  ON public.support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status   ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_lastmsg  ON public.support_tickets(last_message_at DESC);

-- =====================================================
-- 2. ticket_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type  TEXT NOT NULL CHECK (sender_type IN ('customer','staff','system')),
  sender_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name  TEXT,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id, created_at);

-- =====================================================
-- 3. Trigger: aggiorna last_message_at / updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.touch_support_ticket()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets
     SET last_message_at = NEW.created_at,
         updated_at      = now()
   WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_touch_support_ticket ON public.ticket_messages;
CREATE TRIGGER trg_touch_support_ticket
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket();

-- =====================================================
-- 4. RLS
-- =====================================================

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- support_tickets: cliente proprietario o membro org; staff tutto
DROP POLICY IF EXISTS support_tickets_select ON public.support_tickets;
CREATE POLICY support_tickets_select ON public.support_tickets FOR SELECT
  USING (created_by = auth.uid() OR is_member(org_id) OR is_staff());

DROP POLICY IF EXISTS support_tickets_insert ON public.support_tickets;
CREATE POLICY support_tickets_insert ON public.support_tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS support_tickets_update ON public.support_tickets;
CREATE POLICY support_tickets_update ON public.support_tickets FOR UPDATE
  USING (created_by = auth.uid() OR is_member(org_id) OR is_staff())
  WITH CHECK (created_by = auth.uid() OR is_member(org_id) OR is_staff());

-- ticket_messages: visibili se il ticket padre è visibile
DROP POLICY IF EXISTS ticket_messages_select ON public.ticket_messages;
CREATE POLICY ticket_messages_select ON public.ticket_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
     WHERE t.id = ticket_messages.ticket_id
       AND (t.created_by = auth.uid() OR is_member(t.org_id) OR is_staff())
  ));

DROP POLICY IF EXISTS ticket_messages_insert ON public.ticket_messages;
CREATE POLICY ticket_messages_insert ON public.ticket_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets t
     WHERE t.id = ticket_messages.ticket_id
       AND (t.created_by = auth.uid() OR is_member(t.org_id) OR is_staff())
  ));

-- Nota: le API staff usano la service-role key (bypass RLS).
-- Le API cliente usano la sessione utente (RLS attiva).
