-- 20260525_pairing_tokens.sql
--
-- Tabella per il pairing desktop → mobile via QR code.
-- Il backend (/api/auth/pair/generate) firma un JWT con HMAC e ne salva
-- un record con jti come PK. Quando il mobile chiama /api/auth/pair/exchange
-- marchiamo used_at per garantire single-use (anti-replay).
--
-- Idempotente.

create extension if not exists "pgcrypto";

create table if not exists public.pairing_tokens (
  jti uuid primary key default gen_random_uuid(),
  operator_email text not null,
  org_id uuid not null references public.orgs(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  prefill jsonb default '{}'::jsonb,
  generated_by uuid not null references auth.users(id),
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_ip text,
  used_by_user_agent text
);

create index if not exists idx_pairing_tokens_email
  on public.pairing_tokens (operator_email);

create index if not exists idx_pairing_tokens_pending
  on public.pairing_tokens (expires_at)
  where used_at is null;

create index if not exists idx_pairing_tokens_generated_by
  on public.pairing_tokens (generated_by, generated_at desc);

-- RLS: solo service_role può accedere. Staff e mobile passano via API.
alter table public.pairing_tokens enable row level security;

-- Nessuna policy = solo service_role bypassa. Coerente con altre tabelle
-- "internal" del sistema (es. outbox_emails, security_audit_log).

comment on table public.pairing_tokens is
  'Token JWT generati per il pairing desktop→mobile via QR code. PK = jti (single-use).';
comment on column public.pairing_tokens.prefill is
  'Dati pre-compilati per onboarding driver (name, phone, license_no, license_expiry).';
