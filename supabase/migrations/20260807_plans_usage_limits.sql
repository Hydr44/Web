-- 20260807_plans_usage_limits.sql
-- FASE 1 — Limiti d'uso per piano (fondamenta). SOLO schema + risoluzione, NESSUN enforcement.
--
-- (A) Colonne limite di DEFAULT per piano sulla tabella `plans` (nullable/additive → zero rischio).
-- (B) Seed dei default dal listino (starter/professional/business/full).
-- (C) Funzione `get_org_effective_limits(org_id)` = risoluzione limiti effettivi:
--     override per-cliente (org_settings.key='limits') SOPRA il default del piano.
--
-- Gli OVERRIDE per cliente NON hanno bisogno di schema: vivono in org_settings.key='limits'
-- (JSONB EAV già esistente). Chiavi override attese (assente/null = eredita il piano):
--   storage_gb, photo_months, postal_year, autocompile_month, sms_month, ai_budget_eur, sites.
--   (ai_included deriva sempre dal piano, non si sovrascrive per-cliente.)

-- ── (A) colonne limite sul piano ─────────────────────────────────────
alter table public.plans
  add column if not exists limit_storage_gb        integer,   -- archivio documenti/foto (GB)
  add column if not exists limit_photo_months      integer,   -- foto consultabili in linea (mesi)
  add column if not exists limit_postal_year       integer,   -- documenti inviati per posta (anno)
  add column if not exists limit_autocompile_month integer,   -- compilazioni automatiche (mese)
  add column if not exists limit_sms_month         integer,   -- SMS/messaggi (mese)
  add column if not exists ai_included             boolean,   -- consulente IA incluso nel piano
  add column if not exists ai_budget_eur           numeric,   -- budget IA mensile (€) se incluso
  add column if not exists limit_sites             integer;   -- sedi/depositi inclusi

-- ── (B) default per piano (dal listino) ──────────────────────────────
update public.plans set limit_storage_gb=20, limit_photo_months=24, limit_postal_year=2000, limit_autocompile_month=100, limit_sms_month=100, ai_included=false, ai_budget_eur=null, limit_sites=1 where id='starter';
update public.plans set limit_storage_gb=40, limit_photo_months=24, limit_postal_year=4000, limit_autocompile_month=100, limit_sms_month=100, ai_included=true,  ai_budget_eur=8,    limit_sites=1 where id='professional';
update public.plans set limit_storage_gb=60, limit_photo_months=36, limit_postal_year=6000, limit_autocompile_month=250, limit_sms_month=100, ai_included=true,  ai_budget_eur=15,   limit_sites=1 where id='business';
update public.plans set limit_storage_gb=60, limit_photo_months=36, limit_postal_year=6000, limit_autocompile_month=250, limit_sms_month=100, ai_included=true,  ai_budget_eur=15,   limit_sites=1 where id='full';

-- ── (C) risoluzione limiti effettivi (override org → default piano) ──
create or replace function public.get_org_effective_limits(p_org_id uuid)
returns jsonb language sql stable as $$
  with sub as (
    select plan from public.org_subscriptions where org_id = p_org_id limit 1
  ),
  pl as (
    select * from public.plans where id = coalesce((select plan from sub), 'starter') limit 1
  ),
  ovr as (
    select coalesce((select value from public.org_settings
                     where org_id = p_org_id and key = 'limits' limit 1), '{}'::jsonb) as v
  )
  select jsonb_build_object(
    'plan',              (select id from pl),
    'storage_gb',        coalesce((select nullif(v->>'storage_gb','')::numeric from ovr),        (select limit_storage_gb from pl)),
    'photo_months',      coalesce((select nullif(v->>'photo_months','')::numeric from ovr),      (select limit_photo_months from pl)),
    'postal_year',       coalesce((select nullif(v->>'postal_year','')::numeric from ovr),       (select limit_postal_year from pl)),
    'autocompile_month', coalesce((select nullif(v->>'autocompile_month','')::numeric from ovr), (select limit_autocompile_month from pl)),
    'sms_month',         coalesce((select nullif(v->>'sms_month','')::numeric from ovr),         (select limit_sms_month from pl)),
    'ai_included',       (select ai_included from pl),
    'ai_budget_eur',     coalesce((select nullif(v->>'ai_budget_eur','')::numeric from ovr),     (select ai_budget_eur from pl)),
    'sites',             coalesce((select nullif(v->>'sites','')::numeric from ovr),             (select limit_sites from pl))
  );
$$;

comment on function public.get_org_effective_limits(uuid) is
  'FASE 1 limiti: limiti effettivi per org = override (org_settings.limits) sopra i default del piano (plans). Nessun enforcement.';
