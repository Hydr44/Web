/**
 * Helper invio email per il sistema di supporto.
 * Mittente dedicato: supporto@rescuemanager.eu (graceful no-op se RESEND_API_KEY assente).
 * Branding allineato al template condiviso (@/lib/email-template): header scuro con logo,
 * card bianca, footer barra blu, CTA, info rows.
 */

import { brandedHtml, BRAND_BLUE, EMAIL_FONT } from '@/lib/email-template';

const SUPPORT_FROM = 'Supporto RescueManager <supporto@rescuemanager.eu>';
const SUPPORT_INBOX = 'supporto@rescuemanager.eu';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu').replace(/\/$/, '');

const ticketUrl = (id: string) => `${SITE_URL}/dashboard/support/${id}`;
const ticketNo = (id: string) => id.slice(0, 8).toUpperCase();

const esc = (s: string) =>
  String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nl2br = (s: string) => esc(s).replaceAll('\n', '<br>');

/** Citazione brandizzata (left-border blu, coerente col template condiviso). */
function quoteBox(text: string) {
  return `<div style="background:#f8fafc;border-left:4px solid ${BRAND_BLUE};border-radius:0;padding:16px 20px;margin:8px 0 24px;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;line-height:1.6;">${nl2br(text)}</div>`;
}

async function send(to: string, subject: string, html: string, replyTo?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false as const, skipped: true as const };
  try {
    const body: Record<string, unknown> = { from: SUPPORT_FROM, to, subject, html };
    if (replyTo) body.reply_to = replyTo;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error('[support-email] Resend KO:', r.status, await r.text());
      return { ok: false as const };
    }
    return { ok: true as const };
  } catch (err) {
    console.error('[support-email] network error:', err instanceof Error ? err.message : String(err));
    return { ok: false as const };
  }
}

const SLA_TEXT =
  'Tempo medio di risposta: <b>entro 24 ore lavorative</b> (entro 1 ora per la chat dal vivo negli orari di ufficio, Lun–Ven 9:00–18:00).';

/* ─────────── Email al CLIENTE ─────────── */

/** Ticket ricevuto: conferma con numero, dettagli, SLA, link. */
export function notifyCustomerTicketOpened(t: {
  id: string; subject: string; category: string; customer_email: string; customer_name?: string | null; isChat?: boolean;
}) {
  const num = ticketNo(t.id);
  const greeting = `Ciao ${esc(t.customer_name || '')},`.trim();
  const slaLine = t.isChat
    ? 'Un operatore prenderà in carico la chat il prima possibile. ' + SLA_TEXT
    : 'Un operatore ti risponderà a breve. ' + SLA_TEXT;
  const bodyText = [
    `<b>Ticket #${num} ricevuto</b>`,
    greeting,
    'abbiamo ricevuto la tua richiesta di supporto. Di seguito il riepilogo:',
  ].join('\n');
  const html = brandedHtml(bodyText, {
    subtitle: 'Supporto Clienti',
    infoRows: [
      { label: 'Numero ticket', value: `#${num}` },
      { label: 'Oggetto', value: esc(t.subject) },
      { label: 'Categoria', value: esc(t.category) },
      { label: 'Stato', value: 'Aperto' },
    ],
    extraHtml: `<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">${slaLine}</p>
<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">Puoi seguire la conversazione, aggiungere dettagli o allegati direttamente dalla tua area riservata:</p>`,
    cta: { href: ticketUrl(t.id), label: t.isChat ? 'Apri la chat' : 'Vai al ticket' },
  });
  return send(t.customer_email, `Ticket #${num} ricevuto — ${t.subject}`, html, SUPPORT_INBOX);
}

/** Lo staff ha risposto: testo risposta + operatore + link. */
export function notifyCustomerStaffReply(t: {
  id: string; subject: string; customer_email: string; body: string; operator?: string;
}) {
  const num = ticketNo(t.id);
  const html = brandedHtml(
    `<b>Abbiamo risposto al tuo ticket</b>\nAbbiamo risposto al tuo ticket <b>#${num}</b> — "${esc(t.subject)}"${t.operator ? ` (operatore: ${esc(t.operator)})` : ''}:`,
    {
      subtitle: 'Supporto Clienti',
      extraHtml: `${quoteBox(t.body)}
<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">Per leggere la risposta completa, vedere eventuali allegati o continuare la conversazione, accedi all'area riservata:</p>`,
      cta: { href: ticketUrl(t.id), label: 'Apri il ticket e rispondi' },
      footerNote: 'Se non rispondi, considereremo la richiesta risolta dopo alcuni giorni.',
    },
  );
  return send(t.customer_email, `Re: [#${num}] ${t.subject} — Supporto RescueManager`, html, SUPPORT_INBOX);
}

/** Ticket risolto o chiuso: email completa con riepilogo e riapertura. */
export function notifyCustomerStatus(t: {
  id: string; subject: string; customer_email: string; status: string; lastReply?: string | null; operator?: string | null;
}) {
  const num = ticketNo(t.id);
  const resolved = t.status === 'resolved';
  const title = resolved ? `Ticket #${num} risolto` : `Ticket #${num} chiuso`;
  const bodyText = [
    `<b>${title}</b>`,
    `La tua richiesta <b>"${esc(t.subject)}"</b> (ticket <b>#${num}</b>) è stata contrassegnata come <b>${resolved ? 'risolta' : 'chiusa'}</b>${t.operator ? ` dall'operatore ${esc(t.operator)}` : ''}.`,
    t.lastReply ? 'Ultimo aggiornamento dal supporto:' : '',
  ].filter(Boolean).join('\n');
  const html = brandedHtml(bodyText, {
    subtitle: 'Supporto Clienti',
    extraHtml: `${t.lastReply ? quoteBox(t.lastReply) : ''}
<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">Se la soluzione è soddisfacente non devi fare nulla. <b>Se il problema persiste o hai altre domande</b>, ti basta rispondere a questo ticket dall'area riservata: verrà automaticamente riaperto e ripreso in carico.</p>`,
    cta: { href: ticketUrl(t.id), label: 'Apri il ticket' },
    footerNote: 'Grazie per aver utilizzato il supporto RescueManager. Il tuo feedback è importante: puoi indicarci com\'è andata rispondendo a questa email.',
  });
  return send(t.customer_email, `${title} — ${t.subject}`, html, SUPPORT_INBOX);
}

/* ─────────── Email allo STAFF ─────────── */

export function notifyStaffNewTicket(t: {
  id: string; subject: string; category: string; customer_email: string; customer_name?: string | null; body: string; isChat?: boolean;
}) {
  const num = ticketNo(t.id);
  const title = t.isChat ? `Nuova chat dal vivo #${num}` : `Nuovo ticket #${num}`;
  const html = brandedHtml(`<b>${title}</b>`, {
    subtitle: 'Supporto Clienti',
    infoRows: [
      { label: 'Numero', value: `#${num}` },
      { label: 'Oggetto', value: esc(t.subject) },
      { label: 'Categoria', value: esc(t.category) },
      { label: 'Cliente', value: `${esc(t.customer_name || '-')} <${esc(t.customer_email)}>` },
    ],
    extraHtml: `${quoteBox(t.body)}
<p style="margin:0;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;"><em>Apri la voce Supporto nel Pannello Admin (desktop app) per gestire il ticket.</em></p>`,
  });
  return send(SUPPORT_INBOX, `[Supporto${t.isChat ? ' · CHAT' : ''}] #${num} ${t.subject}`, html, t.customer_email);
}

export function notifyStaffCustomerReply(t: {
  id: string; subject: string; customer_email: string; body: string;
}) {
  const num = ticketNo(t.id);
  const html = brandedHtml(
    `<b>Nuova risposta cliente · ticket #${num}</b>\n<b>${esc(t.subject)}</b> — ${esc(t.customer_email)}`,
    {
      subtitle: 'Supporto Clienti',
      extraHtml: `${quoteBox(t.body)}
<p style="margin:0;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;"><em>Apri la voce Supporto nel Pannello Admin (desktop app) per gestire il ticket.</em></p>`,
    },
  );
  return send(SUPPORT_INBOX, `[Supporto] Re: #${num} ${t.subject}`, html, t.customer_email);
}
