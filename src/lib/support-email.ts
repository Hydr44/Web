/**
 * Helper invio email per il sistema di supporto.
 * Mittente dedicato: supporto@rescuemanager.eu (graceful no-op se RESEND_API_KEY assente).
 * Branding allineato al template condiviso (@/lib/email-template): testata blu con il logo,
 * titolo che dice cosa è successo, righe etichetta e valore, un solo pulsante, piè di pagina blu scuro.
 */

import { brandedHtml } from '@/lib/email-template';

const SUPPORT_FROM = 'Supporto RescueManager <supporto@rescuemanager.eu>';
const SUPPORT_INBOX = 'supporto@rescuemanager.eu';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu').replace(/\/$/, '');

const ticketUrl = (id: string) => `${SITE_URL}/dashboard/support/${id}`;
const ticketNo = (id: string) => id.slice(0, 8).toUpperCase();

const esc = (s: string) =>
  String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nl2br = (s: string) => esc(s).replaceAll('\n', '<br>');

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

const SLA_CHAT = 'Negli orari di ufficio, dal lunedì al venerdì dalle 9 alle 18, un operatore prende in carico la chat entro un\'ora.';
const SLA_TICKET = 'Rispondiamo entro 24 ore lavorative.';
const REASON_CLIENTE = 'Ricevi questa email perché hai aperto una richiesta di assistenza su RescueManager.';
const REASON_STAFF = 'Ricevi questa email perché sei nel gruppo che segue l\'assistenza.';

/* ─────────── Email al CLIENTE ─────────── */

/** Richiesta ricevuta: conferma con numero, riepilogo, tempi di risposta, link. */
export function notifyCustomerTicketOpened(t: {
  id: string; subject: string; category: string; customer_email: string; customer_name?: string | null; isChat?: boolean;
}) {
  const num = ticketNo(t.id);
  const html = brandedHtml(
    [
      'Abbiamo ricevuto la tua richiesta di assistenza.',
      t.isChat ? SLA_CHAT : SLA_TICKET,
    ].join('\n'),
    {
      title: 'Richiesta di assistenza ricevuta',
      sub: `Numero ${num}${t.customer_name ? `, ${esc(t.customer_name)}` : ''}`,
      rows: [
        ['Numero', num],
        ['Oggetto', esc(t.subject)],
        ['Argomento', esc(t.category)],
        ['Stato', 'Aperta'],
      ],
      cta: { href: ticketUrl(t.id), label: t.isChat ? 'Apri la chat' : 'Apri la richiesta' },
      note: 'Dalla tua area riservata puoi seguire la conversazione, aggiungere dettagli o allegare file.',
      reason: REASON_CLIENTE,
    },
  );
  return send(t.customer_email, `Richiesta di assistenza ${num} ricevuta`, html, SUPPORT_INBOX);
}

/** Lo staff ha risposto: testo della risposta, operatore, link. */
export function notifyCustomerStaffReply(t: {
  id: string; subject: string; customer_email: string; body: string; operator?: string;
}) {
  const num = ticketNo(t.id);
  const rows: Array<[string, string]> = [
    ['Numero', num],
    ['Oggetto', esc(t.subject)],
  ];
  if (t.operator) rows.push(['Ha risposto', esc(t.operator)]);
  rows.push(['Risposta', nl2br(t.body)]);

  const html = brandedHtml(
    'Abbiamo risposto alla tua richiesta di assistenza.',
    {
      title: 'Hai una risposta',
      sub: `Richiesta ${num}, ${esc(t.subject)}`,
      rows,
      cta: { href: ticketUrl(t.id), label: 'Apri la richiesta e rispondi' },
      note: 'Se non rispondi, dopo qualche giorno consideriamo la richiesta risolta.',
      reason: REASON_CLIENTE,
    },
  );
  return send(t.customer_email, `Risposta alla richiesta ${num}`, html, SUPPORT_INBOX);
}

/** Richiesta risolta o chiusa: riepilogo e come riaprirla. */
export function notifyCustomerStatus(t: {
  id: string; subject: string; customer_email: string; status: string; lastReply?: string | null; operator?: string | null;
}) {
  const num = ticketNo(t.id);
  const resolved = t.status === 'resolved';
  const statoLabel = resolved ? 'Risolta' : 'Chiusa';
  const rows: Array<[string, string]> = [
    ['Numero', num],
    ['Oggetto', esc(t.subject)],
    ['Stato', statoLabel],
  ];
  if (t.operator) rows.push(['Chiusa da', esc(t.operator)]);
  if (t.lastReply) rows.push(['Ultimo aggiornamento', nl2br(t.lastReply)]);

  const html = brandedHtml(
    [
      `La tua richiesta di assistenza è stata segnata come ${statoLabel.toLowerCase()}.`,
      'Se la soluzione va bene non devi fare niente. Se il problema si ripresenta, rispondi dalla tua area riservata e la richiesta torna aperta.',
    ].join('\n'),
    {
      title: `Richiesta ${statoLabel.toLowerCase()}`,
      sub: `Numero ${num}, ${esc(t.subject)}`,
      rows,
      cta: { href: ticketUrl(t.id), label: 'Apri la richiesta' },
      note: 'Se vuoi dirci com\'è andata, rispondi pure a questa email.',
      reason: REASON_CLIENTE,
    },
  );
  return send(t.customer_email, `Richiesta ${num} ${statoLabel.toLowerCase()}`, html, SUPPORT_INBOX);
}

/* ─────────── Email allo STAFF ─────────── */

export function notifyStaffNewTicket(t: {
  id: string; subject: string; category: string; customer_email: string; customer_name?: string | null; body: string; isChat?: boolean;
}) {
  const num = ticketNo(t.id);
  const cosa = t.isChat ? 'Nuova chat dal vivo' : 'Nuova richiesta di assistenza';
  const html = brandedHtml(
    'Apri la voce Assistenza nel pannello per prenderla in carico.',
    {
      title: cosa,
      sub: `Numero ${num}, ${esc(t.customer_name || t.customer_email)}`,
      rows: [
        ['Numero', num],
        ['Oggetto', esc(t.subject)],
        ['Argomento', esc(t.category)],
        ['Cliente', `${esc(t.customer_name || 'Senza nome')}, ${esc(t.customer_email)}`],
        ['Messaggio', nl2br(t.body)],
      ],
      reason: REASON_STAFF,
    },
  );
  return send(SUPPORT_INBOX, `${cosa} ${num}`, html, t.customer_email);
}

export function notifyStaffCustomerReply(t: {
  id: string; subject: string; customer_email: string; body: string;
}) {
  const num = ticketNo(t.id);
  const html = brandedHtml(
    'Apri la voce Assistenza nel pannello per rispondere.',
    {
      title: 'Risposta del cliente',
      sub: `Richiesta ${num}, ${esc(t.customer_email)}`,
      rows: [
        ['Numero', num],
        ['Oggetto', esc(t.subject)],
        ['Cliente', esc(t.customer_email)],
        ['Messaggio', nl2br(t.body)],
      ],
      reason: REASON_STAFF,
    },
  );
  return send(SUPPORT_INBOX, `Risposta del cliente sulla richiesta ${num}`, html, t.customer_email);
}
