-- 20260808_usage_counters.sql
-- FASE 2 — Contatori d'uso mensili per org (nessun enforcement, solo misura + display).
--
-- Metriche mensili: 'sms', 'autocompile', 'ai_eur' (costo IA in €). ('storage' resta una
-- misura live gestita a parte in futuro). Periodo = 'YYYY-MM'. Incremento ATOMICO via RPC
-- (evita race condition di un merge JSONB). Lettura del mese via get_org_usage().

create table if not exists public.usage_counters (
  org_id     uuid not null,
  period     text not null,               -- 'YYYY-MM'
  metric     text not null,               -- 'sms' | 'autocompile' | 'ai_eur' | 'storage_bytes'
  value      numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (org_id, period, metric)
);

alter table public.usage_counters enable row level security;

-- l'org legge i propri contatori (scrittura solo via RPC security-definer / service-role)
drop policy if exists usage_counters_read_own on public.usage_counters;
create policy usage_counters_read_own on public.usage_counters
  for select using (
    org_id in (select org_id from public.org_members where user_id = auth.uid())
  );

-- incremento atomico sul mese corrente; ritorna il nuovo valore
create or replace function public.increment_usage(p_org_id uuid, p_metric text, p_amount numeric default 1)
returns numeric language plpgsql security definer set search_path = public as $$
declare v numeric;
begin
  insert into public.usage_counters (org_id, period, metric, value, updated_at)
  values (p_org_id, to_char(now(),'YYYY-MM'), p_metric, p_amount, now())
  on conflict (org_id, period, metric)
  do update set value = usage_counters.value + excluded.value, updated_at = now()
  returning value into v;
  return v;
end $$;

-- usage del mese (o periodo dato) come jsonb { metric: value, ... }
create or replace function public.get_org_usage(p_org_id uuid, p_period text default null)
returns jsonb language sql stable as $$
  select coalesce(jsonb_object_agg(metric, value), '{}'::jsonb)
  from public.usage_counters
  where org_id = p_org_id
    and period = coalesce(p_period, to_char(now(),'YYYY-MM'));
$$;

revoke all on function public.increment_usage(uuid, text, numeric) from public, anon;
grant execute on function public.increment_usage(uuid, text, numeric) to service_role;
grant execute on function public.get_org_usage(uuid, text) to authenticated, service_role;

comment on table public.usage_counters is
  'FASE 2 limiti: contatori d''uso mensili per org (sms/autocompile/ai_eur/storage). increment_usage() atomico; get_org_usage() legge il mese. Nessun enforcement.';
