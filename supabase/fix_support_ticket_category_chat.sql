-- Fix: support_tickets.category — la CHECK non includeva 'chat'.
-- L'API (/api/support/tickets) accetta category 'chat' per la chat di supporto
-- (isChat), ma il vincolo originale (migration 20260516) ammetteva solo
-- domanda/bug/funzionalita/fatturazione/altro → l'insert con 'chat' falliva con:
--   new row for relation "support_tickets" violates check constraint
--   "support_tickets_category_check"
-- Allineiamo il vincolo alla lista accettata dall'API.
--
-- Applicare su PROD (ienzdgrqalltvkdkuamp) + STAGING.

ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_category_check;

ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_category_check
  CHECK (category IN ('domanda', 'bug', 'funzionalita', 'fatturazione', 'altro', 'chat'));
