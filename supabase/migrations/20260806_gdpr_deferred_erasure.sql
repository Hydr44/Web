-- 20260806_gdpr_deferred_erasure.sql
-- Cancellazione utenti/account conforme GDPR. Risolve: eliminazioni incomplete che lasciavano
-- profili/dati orfani o si bloccavano (FK created_by NO ACTION) dopo aver già cancellato il profilo.
--
-- (A) Tutti i FK di "autore" verso auth.users da NO ACTION → SET NULL (colonne nullable) o CASCADE
--     (le 3 NOT NULL = token/codici dell'utente, muoiono con lui). Così cancellare un utente NON
--     blocca mai e NON lascia orfani: l'autore diventa null, i dati dell'org restano.
-- (B) orgs.created_by: CASCADE → SET NULL (cancellare il fondatore NON deve cancellare l'azienda).
-- (C) Rimuove il FK duplicato su transports.created_by.
-- (D) Erasure DIFFERITA 90 giorni per chiusura account/azienda: soft-delete su orgs + funzioni
--     request/restore/purge. La purga cancella la riga org → CASCADE su ~100 tabelle business +
--     gli auth dei membri (→ CASCADE profili/settings). Idempotente/re-eseguibile.

-- ══════════════════════════════════════════════════════════════════════════
-- (A) FK autore NO ACTION → SET NULL / CASCADE (introspettivo: copre tutte le tabelle)
-- ══════════════════════════════════════════════════════════════════════════
do $$
declare r record;
begin
  for r in
    select con.conname, c1.relname as tbl, a.attname as col, a.attnotnull as nn
    from pg_constraint con
    join pg_class c1      on c1.oid = con.conrelid
    join pg_namespace n1  on n1.oid = c1.relnamespace and n1.nspname = 'public'
    join pg_class c2      on c2.oid = con.confrelid
    join pg_namespace n2  on n2.oid = c2.relnamespace and n2.nspname = 'auth' and c2.relname = 'users'
    join lateral unnest(con.conkey) as ck(attnum) on true
    join pg_attribute a   on a.attrelid = con.conrelid and a.attnum = ck.attnum
    where con.contype = 'f' and con.confdeltype = 'a'   -- solo NO ACTION
  loop
    execute format('alter table public.%I drop constraint %I', r.tbl, r.conname);
    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete %s',
      r.tbl, r.conname, r.col, case when r.nn then 'cascade' else 'set null' end);
  end loop;
end $$;

-- ══════════════════════════════════════════════════════════════════════════
-- (B) orgs.created_by: cancellare il fondatore NON cancella l'azienda
-- ══════════════════════════════════════════════════════════════════════════
alter table public.orgs drop constraint if exists orgs_created_by_fkey;
alter table public.orgs add constraint orgs_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- ══════════════════════════════════════════════════════════════════════════
-- (C) transports.created_by: elimina i FK duplicati verso auth.users, tienine uno solo
-- ══════════════════════════════════════════════════════════════════════════
do $$
declare r record; kept boolean := false;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class c1     on c1.oid = con.conrelid and c1.relname = 'transports'
    join pg_namespace n1 on n1.oid = c1.relnamespace and n1.nspname = 'public'
    join pg_class c2     on c2.oid = con.confrelid and c2.relname = 'users'
    join pg_namespace n2 on n2.oid = c2.relnamespace and n2.nspname = 'auth'
    join lateral unnest(con.conkey) as ck(attnum) on true
    join pg_attribute a  on a.attrelid = con.conrelid and a.attnum = ck.attnum and a.attname = 'created_by'
    where con.contype = 'f'
    order by con.conname
  loop
    if kept then execute format('alter table public.transports drop constraint %I', r.conname);
    else kept := true; end if;
  end loop;
end $$;

-- ══════════════════════════════════════════════════════════════════════════
-- (D) Erasure differita 90 giorni (chiusura account/azienda)
-- ══════════════════════════════════════════════════════════════════════════
alter table public.orgs
  add column if not exists deleted_at            timestamptz,
  add column if not exists purge_after           timestamptz,
  add column if not exists deletion_reason       text,
  add column if not exists deletion_requested_by uuid;

create index if not exists idx_orgs_purge on public.orgs (purge_after) where deleted_at is not null;

-- Richiedi chiusura: soft-delete adesso, purga automatica dopo 90 giorni (recupero entro la scadenza).
create or replace function public.request_account_deletion(p_org uuid, p_reason text default null, p_by uuid default null)
returns public.orgs
language plpgsql security definer set search_path = public as $$
declare o public.orgs;
begin
  update public.orgs
     set deleted_at = now(),
         purge_after = now() + interval '90 days',
         deletion_reason = p_reason,
         deletion_requested_by = coalesce(p_by, auth.uid())
   where id = p_org
   returning * into o;
  if o.id is null then raise exception 'organizzazione inesistente'; end if;
  return o;
end $$;

-- Ripristina un account entro i 90 giorni (annulla la cancellazione programmata).
create or replace function public.restore_account(p_org uuid)
returns public.orgs
language plpgsql security definer set search_path = public as $$
declare o public.orgs;
begin
  update public.orgs
     set deleted_at = null, purge_after = null, deletion_reason = null, deletion_requested_by = null
   where id = p_org
   returning * into o;
  return o;
end $$;

-- Purga gli account scaduti (chiamata dal cron). Per ogni org con purge_after < now():
--   1) cancella gli auth degli utenti membri NON presenti in altre org attive (→ CASCADE profili/settings);
--   2) cancella la riga org → CASCADE su tutte le ~100 tabelle org-scoped.
-- Ritorna il numero di org purgate.
create or replace function public.purge_expired_orgs()
returns integer
language plpgsql security definer set search_path = public as $$
declare o record; m record; n integer := 0;
begin
  for o in
    select id from public.orgs where deleted_at is not null and purge_after < now()
  loop
    for m in select user_id from public.org_members where org_id = o.id loop
      if not exists (
        select 1 from public.org_members mm
        join public.orgs og on og.id = mm.org_id
        where mm.user_id = m.user_id and mm.org_id <> o.id and og.deleted_at is null
      ) then
        delete from auth.users where id = m.user_id;   -- CASCADE: profiles, org_members, subscriptions, user_*
      end if;
    end loop;
    delete from public.orgs where id = o.id;           -- CASCADE: ~100 tabelle business
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.request_account_deletion(uuid, text, uuid) from public, anon;
revoke all on function public.restore_account(uuid)                       from public, anon;
revoke all on function public.purge_expired_orgs()                        from public, anon;
grant execute on function public.request_account_deletion(uuid, text, uuid) to authenticated, service_role;
grant execute on function public.restore_account(uuid)                      to authenticated, service_role;
grant execute on function public.purge_expired_orgs()                       to service_role;
