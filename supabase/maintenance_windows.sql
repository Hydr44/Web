-- ============================================================================
-- Manutenzione programmata strutturata: finestre multiple + storico.
-- Eseguire nel SQL editor di Supabase — progetto PROD: ienzdgrqalltvkdkuamp. Idempotente.
-- Sostituisce la chiave singola system_settings.maintenance (che resta come
-- fallback finché questa tabella non esiste).
-- ============================================================================
create table if not exists public.maintenance_windows (
  id             uuid primary key default gen_random_uuid(),
  title          text,
  message        text not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  warn_minutes   int not null default 30,
  target         text not null default 'all' check (target in ('all','web','desktop','mobile')),
  status         text not null default 'scheduled' check (status in ('scheduled','cancelled')),
  notify_clients boolean not null default true,
  notified_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- NB: gli stati "in corso" / "completata" sono CALCOLATI da starts_at/ends_at
-- vs ora corrente (non servono cron). 'scheduled' = pianificata/attiva,
-- 'cancelled' = annullata manualmente.
create index if not exists idx_maint_windows_active
  on public.maintenance_windows (status, starts_at, ends_at);

alter table public.maintenance_windows enable row level security;
-- Nessuna policy → solo service_role (API server). Lettura pubblica via
-- /api/maintenance/status (service role).

create or replace function public.touch_maint_windows_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_maint_windows_updated on public.maintenance_windows;
create trigger trg_maint_windows_updated
  before update on public.maintenance_windows
  for each row execute function public.touch_maint_windows_updated_at();
