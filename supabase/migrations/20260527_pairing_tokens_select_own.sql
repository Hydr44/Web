-- 20260527_pairing_tokens_select_own.sql
--
-- Permette al desktop (loggato come operatore Supabase) di leggere i
-- pairing_tokens che HA generato lui, così può fare polling/realtime sul
-- proprio jti per sapere quando l'autista consuma il QR.
--
-- Prima esisteva solo service_role bypass — ora aggiungiamo una policy
-- minimale "select own": ciascuno vede solo i propri record.
-- Le insert/update/delete restano riservate al service_role (le API
-- /pair/generate e /pair/exchange ci passano già).
--
-- Idempotente.

alter table public.pairing_tokens enable row level security;

drop policy if exists pairing_tokens_select_own on public.pairing_tokens;

create policy pairing_tokens_select_own
  on public.pairing_tokens
  for select
  to authenticated
  using (generated_by = auth.uid());

comment on policy pairing_tokens_select_own on public.pairing_tokens is
  'Permette al generatore del token (desktop operatore) di leggere lo stato del proprio pairing per polling/realtime live.';
