-- Migration: Supporto — abilita Supabase Realtime
-- Created: 2026-05-16 (follow-up di 20260516_support_tickets*.sql)
--
-- Aggiunge support_tickets e ticket_messages alla publication supabase_realtime
-- così il client cliente (sessione utente, RLS attiva) riceve in tempo reale
-- nuove risposte / cambi stato. Idempotente: salta se già presenti.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public' AND tablename = 'support_tickets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public' AND tablename = 'ticket_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages';
  END IF;
END $$;

-- REPLICA IDENTITY FULL: i payload realtime includono i valori delle righe
-- (utile per i filtri lato client su ticket_id / created_by).
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;
