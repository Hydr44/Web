-- Migration: Notifica email all'arrivo di una fattura/autofattura passiva
-- Created: 2026-07-09
--
-- Requisito (admin panel): quando arriva un nuovo documento PASSIVO (fattura
-- ricevuta da fornitore o autofattura) per l'org RescueManager, invia una email
-- a info@rescuemanager.eu.
--
-- Meccanismo: trigger AFTER INSERT su `invoices` → chiama l'API Resend via pg_net
-- (nessuna dipendenza da app/deploy). La chiave Resend è letta da Supabase Vault
-- (secret 'resend_api_key', inserito FUORI da questo file per non versionarla).
--
-- Ambito: SOLO org emittente RescueManager (default 1ea3be12-...; override via
-- setting `app.rescuemanager_org_id`) → non notifica le passive dei clienti.
-- Idempotente: CREATE OR REPLACE + DROP/CREATE TRIGGER. AFTER INSERT scatta una
-- sola volta per riga → le passive già esistenti NON generano email.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_passive_invoice()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  v_key     text;
  v_kind    text;
  v_subject text;
  v_html    text;
  v_org     uuid := coalesce(nullif(current_setting('app.rescuemanager_org_id', true), ''),
                             '1ea3be12-a439-46ac-94d9-eaff1bb346c2')::uuid;
begin
  -- Solo documenti passivi dell'org RescueManager (= admin panel).
  if new.direction is distinct from 'passive' then return new; end if;
  if new.org_id <> v_org then return new; end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null or v_key = '' then return new; end if;  -- nessuna chiave → no-op

  v_kind := case
              when coalesce(new.number, '') like 'AF/%' or (new.meta ? 'autofattura')
                then 'Autofattura'
              else 'Fattura passiva'
            end;

  v_subject := '[RescueManager] Nuova ' || v_kind || ' ricevuta — ' || coalesce(new.number, 's/n');

  v_html :=
    '<p>È arrivata una nuova <b>' || v_kind || '</b> in RescueManager.</p>' ||
    '<table cellpadding="4" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' ||
    '<tr><td><b>Numero</b></td><td>'    || coalesce(new.number, '—')       || '</td></tr>' ||
    '<tr><td><b>Fornitore</b></td><td>' || coalesce(new.customer_name, '—') || '</td></tr>' ||
    '<tr><td><b>P.IVA</b></td><td>'     || coalesce(new.customer_vat, '—')  || '</td></tr>' ||
    '<tr><td><b>Totale</b></td><td>'    || coalesce(new.total::text, '—')   || ' €</td></tr>' ||
    '<tr><td><b>Data</b></td><td>'      || coalesce(new.date::text, '—')    || '</td></tr>' ||
    '</table>' ||
    '<p style="color:#64748b;font-size:12px">Notifica automatica · pannello amministrativo RescueManager.</p>';

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    body    := jsonb_build_object(
                 'from', 'RescueManager <noreply@rescuemanager.eu>',
                 'to', jsonb_build_array('info@rescuemanager.eu'),
                 'subject', v_subject,
                 'html', v_html
               ),
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || v_key,
                 'Content-Type', 'application/json'
               )
  );

  return new;
exception when others then
  -- Una notifica fallita NON deve mai bloccare l'inserimento della fattura.
  return new;
end
$$;

drop trigger if exists trg_notify_passive_invoice on invoices;
create trigger trg_notify_passive_invoice
  after insert on invoices
  for each row
  execute function public.notify_passive_invoice();
