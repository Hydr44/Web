-- Migration: Notifica email (brandizzata) all'arrivo di una fattura/autofattura passiva
-- Created: 2026-07-09 · Aggiornata: 2026-07-14
--
-- Requisito: quando RICEVIAMO un documento tramite SdI (per l'org RescueManager)
-- invia una email brandizzata "Hai ricevuto una fattura da <fornitore>" a
-- info@rescuemanager.eu. Copre DUE casi:
--   (A) INSERT  — fattura passiva VERA appena importata dal processor soap-rx
--                 (direction='passive' + meta.source.type='soap_rx_import').
--   (B) UPDATE  — documento consegnato da SdI appena allegato (meta.sdi_ricevuta
--                 passa da assente a presente): copre le AUTOFATTURE che rientrano
--                 sul nostro canale (vengono aggiornate, non inserite).
-- NON scatta alla CREAZIONE di una bozza (nessuna delle due condizioni è vera).
--
-- Meccanismo: trigger AFTER INSERT + AFTER UPDATE su `invoices` → Resend via pg_net.
-- Chiave Resend dal Vault (secret 'resend_api_key'). Idempotente (CREATE OR REPLACE).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_passive_invoice()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  v_key     text;
  v_fire    boolean := false;
  v_forn    text;
  v_kind    text;
  v_subject text;
  v_html    text;
  v_org     uuid := coalesce(nullif(current_setting('app.rescuemanager_org_id', true), ''),
                             '1ea3be12-a439-46ac-94d9-eaff1bb346c2')::uuid;
begin
  if new.org_id <> v_org then return new; end if;

  -- (A) passiva vera appena ricevuta, oppure (B) documento consegnato appena allegato.
  if tg_op = 'INSERT' then
    if new.direction = 'passive' and coalesce(new.meta->'source'->>'type', '') = 'soap_rx_import' then
      v_fire := true;
    end if;
  elsif tg_op = 'UPDATE' then
    if (new.meta ? 'sdi_ricevuta') and not (coalesce(old.meta, '{}'::jsonb) ? 'sdi_ricevuta') then
      v_fire := true;
    end if;
  end if;
  if not v_fire then return new; end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null or v_key = '' then return new; end if;  -- nessuna chiave → no-op

  v_kind := case
              when coalesce(new.number, '') like 'AF/%' or (new.meta ? 'autofattura') then 'autofattura'
              else 'fattura'
            end;
  v_forn := coalesce(nullif(btrim(new.customer_name), ''), 'un fornitore');
  v_subject := 'Hai ricevuto una ' || v_kind || ' da ' || v_forn;

  v_html :=
    '<div style="background:#f1f5f9;padding:24px 0;font-family:-apple-system,Segoe UI,Arial,sans-serif">' ||
    '<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,.10)">' ||
    '<div style="background:#1e40af;padding:20px 28px">' ||
    '<div style="color:#ffffff;font-size:19px;font-weight:800;letter-spacing:.3px">RescueManager</div>' ||
    '</div>' ||
    '<div style="padding:28px 28px 8px">' ||
    '<div style="font-size:12px;color:#2563eb;font-weight:800;text-transform:uppercase;letter-spacing:.7px">Nuova ' || v_kind || ' ricevuta</div>' ||
    '<div style="margin:10px 0 4px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.25">Hai ricevuto una ' || v_kind || ' da<br><span style="color:#1e40af">' || v_forn || '</span></div>' ||
    '<p style="color:#475569;font-size:14px;margin:10px 0 18px">È arrivata tramite il Sistema di Interscambio ed è disponibile nel gestionale.</p>' ||
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' ||
    '<tr><td style="padding:9px 0;color:#64748b">Fornitore</td><td style="padding:9px 0;text-align:right;color:#0f172a;font-weight:700">' || v_forn || '</td></tr>' ||
    '<tr style="border-top:1px solid #eef2f7"><td style="padding:9px 0;color:#64748b">Numero</td><td style="padding:9px 0;text-align:right;color:#0f172a">' || coalesce(new.number, '—') || '</td></tr>' ||
    '<tr style="border-top:1px solid #eef2f7"><td style="padding:9px 0;color:#64748b">P.IVA</td><td style="padding:9px 0;text-align:right;color:#0f172a">' || coalesce(new.customer_vat, '—') || '</td></tr>' ||
    '<tr style="border-top:1px solid #eef2f7"><td style="padding:9px 0;color:#64748b">Totale</td><td style="padding:9px 0;text-align:right;color:#0f172a;font-weight:800">' || coalesce(new.total::text, '—') || ' €</td></tr>' ||
    '<tr style="border-top:1px solid #eef2f7"><td style="padding:9px 0;color:#64748b">Data</td><td style="padding:9px 0;text-align:right;color:#0f172a">' || coalesce(new.date::text, '—') || '</td></tr>' ||
    '</table>' ||
    '</div>' ||
    '<div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #eef2f7;color:#94a3b8;font-size:12px">Notifica automatica · RescueManager · Fatturazione elettronica</div>' ||
    '</div></div>';

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
  -- Una notifica fallita NON deve mai bloccare l'operazione sulla fattura.
  return new;
end
$$;

drop trigger if exists trg_notify_passive_invoice on invoices;
create trigger trg_notify_passive_invoice
  after insert on invoices
  for each row
  execute function public.notify_passive_invoice();

-- Nuovo: scatta anche quando alleghiamo il documento consegnato (autofatture che rientrano).
drop trigger if exists trg_notify_received_doc on invoices;
create trigger trg_notify_received_doc
  after update on invoices
  for each row
  execute function public.notify_passive_invoice();
