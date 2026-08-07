-- Fix: lead_quotes.plan_type_check disallineato dal listino reale.
--
-- Sintomo: POST /api/leads/:id/quotes -> 500. Nel DB (postgres_logs):
--   ERROR 23514  new row for relation "lead_quotes" violates check
--   constraint "lead_quotes_plan_type_check"  (plan_type = 'professional')
--
-- Causa: il CHECK ammetteva i nomi VECCHI del listino
--   ('starter','flotta','enterprise','custom')
-- mentre la tabella `plans` (fonte unica) usa: starter/professional/business/full.
-- Creare un preventivo con piano 'professional' (o business/full) veniva quindi
-- rifiutato dal DB e il lead-api restituiva 500.
--
-- Additivo/non-breaking: gli unici valori presenti in lead_quotes erano
-- 'starter' e 'custom', entrambi mantenuti. Applicata su PROD 2026-07-31.
ALTER TABLE public.lead_quotes DROP CONSTRAINT IF EXISTS lead_quotes_plan_type_check;
ALTER TABLE public.lead_quotes ADD CONSTRAINT lead_quotes_plan_type_check
  CHECK (plan_type = ANY (ARRAY['starter'::text, 'professional'::text, 'business'::text, 'full'::text, 'custom'::text]));
