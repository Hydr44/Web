-- 20260811_usage_alerts.sql
-- FASE 4 — Avvisi "superamento morbido" dei limiti d'uso.
-- Traccia gli avvisi già inviati per evitare doppioni: un'email per
-- org × metrica × soglia (80/100) × mese. Nessun enforcement/blocco.
-- Il cron /api/cron/usage-alerts legge/scrive qui via service_role.

create table if not exists public.usage_alerts (
  org_id    uuid not null,
  period    text not null,     -- 'YYYY-MM'
  metric    text not null,     -- 'autocompile' | 'sms' | 'ai_eur' | 'storage'
  threshold int  not null,     -- 80 | 100
  sent_at   timestamptz not null default now(),
  primary key (org_id, period, metric, threshold)
);

alter table public.usage_alerts enable row level security;
-- Nessuna policy: accesso solo via service_role (il cron). Bloccato per authenticated/anon.

comment on table public.usage_alerts is
  'FASE 4 limiti: avvisi 80%/100% già inviati (anti-doppione, per org/metrica/soglia/mese).';
