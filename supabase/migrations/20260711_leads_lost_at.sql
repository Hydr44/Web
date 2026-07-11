-- Timestamp di quando un lead è stato segnato come "perso" (simmetrico a converted_at).
-- Usato da POST /api/staff/admin/leads/[id]/lose e dall'archiviazione lead chiusi.
-- Applicata su prod (ienzdg) e staging (rqwdimgw) il 2026-07-11.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_at timestamptz;
