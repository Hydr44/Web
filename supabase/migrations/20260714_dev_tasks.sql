-- Lista "Da fare" condivisa del team (blocco note operativo admin + assistente AI).
-- RLS abilitata senza policy → accessibile solo via service_role (come le altre
-- tabelle staff-only). Lo staff vi accede tramite gli endpoint /api/staff/admin/todos.
create table if not exists public.dev_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  status text not null default 'open',      -- open | doing | done
  priority text not null default 'medium',  -- high | medium | low
  area text,                                -- tag libero (fatturazione, mobile, geotab...)
  created_by text not null default 'user',  -- 'user' | 'claude'
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz
);

alter table public.dev_tasks enable row level security;

create index if not exists dev_tasks_status_idx
  on public.dev_tasks (status, priority, created_at desc);
