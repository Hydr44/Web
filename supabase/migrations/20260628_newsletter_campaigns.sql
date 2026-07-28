-- Newsletter campaigns (bozze + inviate) gestite dall'admin.
-- Le campagne nascono da eventi regulatory_monitor (auto) o vuote (manuali),
-- si rivedono, si testano e si inviano come Resend Broadcast all'Audience.
-- Backend-only: RLS attiva senza policy → solo service_role (API staff).
--
-- Applicare su Supabase (SQL editor) PROD. Idempotente.

create table if not exists public.newsletter_campaigns (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,                 -- nome interno (lista admin)
  subject            text not null,                 -- oggetto email
  body_html          text not null default '',
  status             text not null default 'draft'
                       check (status in ('draft', 'ready', 'sent')),
  source_event_ids   uuid[],                        -- eventi regulatory_monitor usati
  resend_broadcast_id text,
  recipients_count   int,
  test_sent_at       timestamptz,
  sent_at            timestamptz,
  created_by         text,                          -- staff id/email
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_newsletter_campaigns_status
  on public.newsletter_campaigns (status, created_at desc);

alter table public.newsletter_campaigns enable row level security;

-- Trigger updated_at (riusa la funzione della migration subscribers se presente,
-- altrimenti la crea).
create or replace function public.touch_newsletter_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_newsletter_campaigns_updated on public.newsletter_campaigns;
create trigger trg_newsletter_campaigns_updated
  before update on public.newsletter_campaigns
  for each row execute function public.touch_newsletter_updated_at();
