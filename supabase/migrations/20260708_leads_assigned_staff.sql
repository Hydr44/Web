-- Migration: Lead owner canonico verso staff (CRM Commerciale — Fase 0)
-- Created: 2026-07-08
-- Spec: docs/specs/crm-commerciale-provvigione.md §3.1
--
-- Contesto: il commerciale è uno `staff` (auth separata da Supabase Auth), ma
-- `leads.assigned_to` è FK -> auth.users(id). Per lo scoping "ognuno vede solo i
-- propri lead" serve un owner che punti a `staff(id)`.
--
-- Idempotente e SOLO-ADDITIVA: sicura su prod (ienzdgrqalltvkdkuamp) e staging
-- (rqwdimgwtewrsintvwoe) a prescindere dalla loro divergenza. Non modifica dati
-- esistenti se non il backfill best-effort dei soli owner NULL.

-- 1. Colonna owner canonica -> staff
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;

COMMENT ON COLUMN leads.assigned_staff_id IS
  'Owner CRM del lead (staff.id). Fonte di verità per lo scoping commerciale. `assigned_to` (auth.users) resta legacy e non governa la visibilità.';

CREATE INDEX IF NOT EXISTS idx_leads_assigned_staff ON leads(assigned_staff_id);

-- 2. Backfill best-effort: mappa il vecchio assigned_to (auth.users) allo staff
--    con la stessa email. Riempie SOLO gli owner ancora NULL, non sovrascrive.
--    Se nessun match (caso normale: assigned_to quasi sempre NULL/incoerente),
--    non fa nulla — l'assegnazione avverrà dall'UI (Fase 0, lato admin panel).
UPDATE leads AS l
SET assigned_staff_id = s.id
FROM auth.users AS u
JOIN staff AS s ON lower(s.email) = lower(u.email)
WHERE l.assigned_to = u.id
  AND l.assigned_staff_id IS NULL;
