-- Audit log staff: consenti staff_id NULL per azioni di sistema/anonime
-- (es. creazione staff seed con attore 'system'). Idempotente.
ALTER TABLE public.staff_audit_log ALTER COLUMN staff_id DROP NOT NULL;
