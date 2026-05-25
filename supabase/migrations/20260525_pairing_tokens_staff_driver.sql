-- 20260525_pairing_tokens_staff_driver.sql
--
-- Estende pairing_tokens per supportare il caso "wizard desktop GPS" dove
-- l'autista è un record `staff_drivers` (uuid) invece di `drivers` (uuid mobile).
-- I due sono tabelle parallele (legacy) — almeno una delle due dev'essere
-- referenziata nel pairing.
--
-- Idempotente.

alter table public.pairing_tokens
  add column if not exists staff_driver_id uuid
    references public.staff_drivers(id) on delete set null;

create index if not exists idx_pairing_tokens_staff_driver
  on public.pairing_tokens (staff_driver_id);

-- Vincolo: almeno uno fra driver_id e staff_driver_id deve essere valorizzato
-- (rilassato: se nessuno è valorizzato la pair è "generica per email" — OK
-- per casi futuri tipo invito email senza driver-record pre-esistente).
-- Per ora nessun CHECK constraint.

comment on column public.pairing_tokens.staff_driver_id is
  'Driver dal pannello desktop (staff_drivers). Alternativo a driver_id (drivers tabella mobile).';
