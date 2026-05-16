-- Migration: Supporto — enhancements
-- Created: 2026-05-16 (follow-up di 20260516_support_tickets.sql)
--
--  - Rimuove le FK verso auth.users (identità miste: cliente=auth.users,
--    staff=tabella staff separata) che causavano errori 23503 sul reply staff.
--  - Aggiunge flag "non letto" per evidenziare in-app le nuove risposte.
--  - Aggiunge allegati ai messaggi (metadati R2 in jsonb).
-- Idempotente / additiva: nessuna perdita dati.

-- 1. Rimozione FK auth.users
ALTER TABLE public.ticket_messages DROP CONSTRAINT IF EXISTS ticket_messages_sender_id_fkey;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_fkey;

-- 2. Flag non letto
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS customer_unread BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS staff_unread    BOOLEAN NOT NULL DEFAULT true;

-- 3. Allegati per messaggio (array di {name, key, size, type})
ALTER TABLE public.ticket_messages
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_unread
  ON public.support_tickets(customer_unread) WHERE customer_unread;
CREATE INDEX IF NOT EXISTS idx_support_tickets_staff_unread
  ON public.support_tickets(staff_unread) WHERE staff_unread;
