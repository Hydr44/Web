-- Note interne staff sul cliente (thread). Additiva, solo service_role.
create table if not exists public.client_notes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  author_email text,
  author_name  text,
  kind        text not null default 'generale',
  body        text not null,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.client_notes enable row level security;
create index if not exists client_notes_org_idx on public.client_notes (org_id, pinned desc, created_at desc);
