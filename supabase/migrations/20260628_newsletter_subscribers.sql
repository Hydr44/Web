-- Newsletter subscribers (sito pubblico) — double opt-in + unsubscribe.
-- I contatti CONFERMATI vengono anche sincronizzati su una Resend Audience
-- (da cui si inviano le Broadcast). Qui teniamo la prova del consenso (GDPR):
-- consent_at + ip + user_agent + stato.
--
-- Applicare su Supabase (SQL editor) PROD. Idempotente.

create table if not exists public.newsletter_subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  status             text not null default 'pending'
                       check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token      text not null,
  unsubscribe_token  text not null,
  source             text,                    -- es. 'footer', 'landing'
  consent_at         timestamptz,             -- quando ha spuntato il consenso (submit)
  confirmed_at       timestamptz,             -- double opt-in completato
  unsubscribed_at    timestamptz,
  ip                 text,
  user_agent         text,
  resend_contact_id  text,                    -- id contatto nell'Audience Resend
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Email univoca (case-insensitive).
create unique index if not exists uq_newsletter_email
  on public.newsletter_subscribers (lower(email));
create index if not exists idx_newsletter_confirm_token
  on public.newsletter_subscribers (confirm_token);
create index if not exists idx_newsletter_unsub_token
  on public.newsletter_subscribers (unsubscribe_token);

-- RLS attiva senza policy: accesso SOLO da service_role (le API server).
-- Niente lettura/scrittura pubblica (PostgREST non espone la tabella all'anon).
alter table public.newsletter_subscribers enable row level security;

-- Trigger updated_at.
create or replace function public.touch_newsletter_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_newsletter_updated on public.newsletter_subscribers;
create trigger trg_newsletter_updated
  before update on public.newsletter_subscribers
  for each row execute function public.touch_newsletter_updated_at();
