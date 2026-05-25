-- 20260525_pairing_tokens_staff_driver.sql
--
-- Estende pairing_tokens per supportare il caso "wizard desktop GPS" dove
-- l'autista è un record `staff_drivers` (bigint in prod) invece di
-- `drivers` (uuid, tabella mobile). I due sono tabelle parallele (legacy).
--
-- NOTA: lo schema prod di staff_drivers usa `id bigint` (legacy),
-- diverso dalla migration 20260306_staff_drivers.sql del desktop-app
-- che dichiarava `id uuid` ma non è mai stata applicata a prod.
--
-- Idempotente.

alter table public.pairing_tokens
  add column if not exists staff_driver_id bigint
    references public.staff_drivers(id) on delete set null;

create index if not exists idx_pairing_tokens_staff_driver
  on public.pairing_tokens (staff_driver_id);

comment on column public.pairing_tokens.staff_driver_id is
  'Driver dal pannello desktop (staff_drivers.id, bigint legacy). Alternativo a driver_id (drivers tabella mobile, uuid).';
