-- Migration: Supporto — Realtime Broadcast (chat istantanea lato staff)
-- Created: 2026-05-17
--
-- Lo staff (admin-panel) usa la anon key SENZA sessione Supabase, quindi i
-- postgres_changes filtrati da RLS non gli arrivano. Soluzione: un trigger
-- sul DB pubblica un evento Broadcast sul topic "support" ad ogni nuovo
-- messaggio. Il payload contiene solo ticket_id + sender_type (nessun
-- contenuto sensibile): l'admin, ricevuto il segnale, ricarica via API
-- autenticata. Idempotente.

CREATE OR REPLACE FUNCTION public.support_broadcast_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object(
      'ticket_id', NEW.ticket_id,
      'sender_type', NEW.sender_type,
      'at', NEW.created_at
    ),
    'message',          -- event
    'support',          -- topic
    false               -- private = false (broadcast pubblico, solo id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_support_broadcast_message ON public.ticket_messages;
CREATE TRIGGER trg_support_broadcast_message
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.support_broadcast_message();

-- Notifica anche i cambi di stato/assegnazione (resolve/close/assign bulk)
CREATE OR REPLACE FUNCTION public.support_broadcast_ticket()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    PERFORM realtime.send(
      jsonb_build_object('ticket_id', NEW.id, 'sender_type', 'system', 'at', now()),
      'message', 'support', false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_support_broadcast_ticket ON public.support_tickets;
CREATE TRIGGER trg_support_broadcast_ticket
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_broadcast_ticket();
