-- ============================================================================
-- Tracking accettazione documenti legali (Privacy / Cookie / Termini / DPA)
-- Eseguire nel SQL editor di Supabase — progetto PROD: ienzdgrqalltvkdkuamp
-- ============================================================================

-- 1) Registro delle accettazioni (prova del consenso: chi, quale versione, quando, IP)
create table if not exists public.policy_acceptances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  version     text not null,
  accepted_at timestamptz not null default now(),
  ip          text,
  user_agent  text
);

create index if not exists idx_policy_acceptances_user
  on public.policy_acceptances (user_id, accepted_at desc);

-- RLS: ogni utente vede/inserisce solo le proprie accettazioni.
-- Le API server-side usano il service role, che bypassa la RLS.
alter table public.policy_acceptances enable row level security;

drop policy if exists "pa_own_select" on public.policy_acceptances;
create policy "pa_own_select" on public.policy_acceptances
  for select using (auth.uid() = user_id);

drop policy if exists "pa_own_insert" on public.policy_acceptances;
create policy "pa_own_insert" on public.policy_acceptances
  for insert with check (auth.uid() = user_id);

-- 2) Versione legale corrente (seed). Poi modificabile dal pannello admin → Legale.
insert into public.system_settings (key, value, description, updated_at)
values (
  'legal_policy',
  '{"version":"3.0","effective_date":"2026-02-23","note":"Versione iniziale"}'::jsonb,
  'Versione corrente documenti legali (Privacy/Cookie/Termini/DPA)',
  now()
)
on conflict (key) do nothing;
