-- ============================================================================
-- Avvisi / annunci ai clienti (banner in-app: web, desktop, mobile).
-- Eseguire nel SQL editor di Supabase — progetto PROD: ienzdgrqalltvkdkuamp
-- Idempotente.
-- ============================================================================
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  level       text not null default 'info'  check (level in ('info','warning','success','critical')),
  target      text not null default 'all'   check (target in ('all','web','desktop','mobile')),
  active      boolean not null default true,
  dismissible boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_announcements_active
  on public.announcements (active, starts_at, ends_at);

-- RLS attiva senza policy: accesso SOLO da service_role (le API server).
-- La lettura "pubblica" passa da /api/announcements/active (service role).
alter table public.announcements enable row level security;

-- Trigger updated_at.
create or replace function public.touch_announcements_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_announcements_updated on public.announcements;
create trigger trg_announcements_updated
  before update on public.announcements
  for each row execute function public.touch_announcements_updated_at();
