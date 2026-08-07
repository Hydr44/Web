-- Support tickets: colonna `source` (origine del ticket)
-- Applicare PRIMA del deploy website (l'API la scrive best-effort, quindi
-- il deploy non si rompe se l'ordine è invertito — ma per avere il valore
-- corretto da subito conviene applicare questo SQL prima).
--
-- Valori previsti:
--   web        → ticket aperto dalla dashboard web (default)
--   desktop    → app desktop, pulsante "Contatta il supporto"
--   assistente → proposto dall'assistente AI (RescueAI) e confermato dall'utente
--   mobile     → app mobile (futuro)

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_support_tickets_source
  ON public.support_tickets(source);

COMMENT ON COLUMN public.support_tickets.source IS
  'Origine ticket: web | desktop | assistente (bot AI) | mobile';
