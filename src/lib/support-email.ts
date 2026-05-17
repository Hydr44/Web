/**
 * Helper invio email per il sistema di supporto.
 * Mittente dedicato: supporto@rescuemanager.eu (graceful no-op se RESEND_API_KEY assente).
 * Branding allineato al template lead/preventivi (header gradiente, footer brandizzato).
 */

const SUPPORT_FROM = 'Supporto RescueManager <supporto@rescuemanager.eu>';
const SUPPORT_INBOX = 'supporto@rescuemanager.eu';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu').replace(/\/$/, '');

const ticketUrl = (id: string) => `${SITE_URL}/dashboard/support/${id}`;
const ticketNo = (id: string) => id.slice(0, 8).toUpperCase();

const esc = (s: string) =>
  String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nl2br = (s: string) => esc(s).replaceAll('\n', '<br>');

function paragraph(text: string) {
  return `<p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">${text}</p>`;
}

function quoteBox(text: string) {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #3b82f6;border-radius:6px;padding:14px 16px;margin:0 0 16px;color:#0f172a;font-size:14px;line-height:1.6;">${nl2br(text)}</div>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;color:#64748b;font-size:13px;width:140px;">${esc(label)}</td>
    <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${esc(value)}</td>
  </tr>`;
}

function ctaButton(href: string, label: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:8px;background:#2563eb;">
    <a href="${href}" style="display:inline-block;padding:12px 26px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${esc(label)}</a>
  </td></tr></table>`;
}

/** Template brandato condiviso (stesso stile di lead/preventivi). */
function brandedEmail(opts: { title: string; intro?: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#10b981);padding:30px 40px;border-radius:8px 8px 0 0;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:600;">RescueManager</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Supporto Clienti</p>
</td></tr>
<tr><td style="padding:40px;">
<h2 style="margin:0 0 16px;color:#0f172a;font-size:19px;font-weight:700;">${esc(opts.title)}</h2>
${opts.intro ? paragraph(opts.intro) : ''}
${opts.bodyHtml}
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 40px;border-radius:0 0 8px 8px;border-top:1px solid #e9ecef;">
<p style="margin:0 0 6px;color:#64748b;font-size:12px;text-align:center;">
Hai bisogno di aiuto? Scrivi a <a href="mailto:supporto@rescuemanager.eu" style="color:#3b82f6;">supporto@rescuemanager.eu</a> o chiama il +39 392 172 3028
</p>
<p style="margin:0;color:#999;font-size:12px;text-align:center;">
&copy; ${new Date().getFullYear()} RescueManager - Software Gestionale per Autodemolizioni<br>
<a href="https://rescuemanager.eu" style="color:#3b82f6;">rescuemanager.eu</a>
</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
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
  const body = `
    ${paragraph(`Ciao ${esc(t.customer_name || '')},`.trim())}
    ${paragraph('abbiamo ricevuto la tua richiesta di supporto. Di seguito il riepilogo:')}
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;width:100%;">
      ${infoRow('Numero ticket', `#${num}`)}
      ${infoRow('Oggetto', t.subject)}
      ${infoRow('Categoria', t.category)}
      ${infoRow('Stato', 'Aperto')}
    </table>
    ${paragraph(t.isChat
      ? 'Un operatore prenderà in carico la chat il prima possibile. ' + SLA_TEXT
      : 'Un operatore ti risponderà a breve. ' + SLA_TEXT)}
    ${paragraph('Puoi seguire la conversazione, aggiungere dettagli o allegati direttamente dalla tua area riservata:')}
    ${ctaButton(ticketUrl(t.id), t.isChat ? 'Apri la chat' : 'Vai al ticket')}
  `;
  return send(t.customer_email, `Ticket #${num} ricevuto — ${t.subject}`,
    brandedEmail({ title: `Ticket #${num} ricevuto`, bodyHtml: body }), SUPPORT_INBOX);
}

/** Lo staff ha risposto: testo risposta + operatore + link. */
export function notifyCustomerStaffReply(t: {
  id: string; subject: string; customer_email: string; body: string; operator?: string;
}) {
  const num = ticketNo(t.id);
  const body = `
    ${paragraph(`Abbiamo risposto al tuo ticket <b>#${num}</b> — "${esc(t.subject)}"${t.operator ? ` (operatore: ${esc(t.operator)})` : ''}:`)}
    ${quoteBox(t.body)}
    ${paragraph('Per leggere la risposta completa, vedere eventuali allegati o continuare la conversazione, accedi all\'area riservata:')}
    ${ctaButton(ticketUrl(t.id), 'Apri il ticket e rispondi')}
    ${paragraph('<span style="color:#64748b;font-size:13px;">Se non rispondi, considereremo la richiesta risolta dopo alcuni giorni.</span>')}
  `;
  return send(t.customer_email, `Re: [#${num}] ${t.subject} — Supporto RescueManager`,
    brandedEmail({ title: 'Abbiamo risposto al tuo ticket', bodyHtml: body }), SUPPORT_INBOX);
}

/** Ticket risolto o chiuso: email completa con riepilogo e riapertura. */
export function notifyCustomerStatus(t: {
  id: string; subject: string; customer_email: string; status: string; lastReply?: string | null; operator?: string | null;
}) {
  const num = ticketNo(t.id);
  const resolved = t.status === 'resolved';
  const title = resolved ? `Ticket #${num} risolto` : `Ticket #${num} chiuso`;
  const body = `
    ${paragraph(`La tua richiesta <b>"${esc(t.subject)}"</b> (ticket <b>#${num}</b>) è stata contrassegnata come <b>${resolved ? 'risolta' : 'chiusa'}</b>${t.operator ? ` dall'operatore ${esc(t.operator)}` : ''}.`)}
    ${t.lastReply ? paragraph('Ultimo aggiornamento dal supporto:') + quoteBox(t.lastReply) : ''}
    ${paragraph('Se la soluzione è soddisfacente non devi fare nulla. <b>Se il problema persiste o hai altre domande</b>, ti basta rispondere a questo ticket dall\'area riservata: verrà automaticamente riaperto e ripreso in carico.')}
    ${ctaButton(ticketUrl(t.id), 'Apri il ticket')}
    ${paragraph('<span style="color:#64748b;font-size:13px;">Grazie per aver utilizzato il supporto RescueManager. Il tuo feedback è importante: puoi indicarci com\'è andata rispondendo a questa email.</span>')}
  `;
  return send(t.customer_email, `${title} — ${t.subject}`,
    brandedEmail({ title, bodyHtml: body }), SUPPORT_INBOX);
}

/* ─────────── Email allo STAFF ─────────── */

export function notifyStaffNewTicket(t: {
  id: string; subject: string; category: string; customer_email: string; customer_name?: string | null; body: string; isChat?: boolean;
}) {
  const num = ticketNo(t.id);
  const html = brandedEmail({
    title: t.isChat ? `Nuova chat dal vivo #${num}` : `Nuovo ticket #${num}`,
    bodyHtml: `
      <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;width:100%;">
        ${infoRow('Numero', `#${num}`)}
        ${infoRow('Oggetto', t.subject)}
        ${infoRow('Categoria', t.category)}
        ${infoRow('Cliente', `${t.customer_name || '-'} <${t.customer_email}>`)}
      </table>
      ${quoteBox(t.body)}
      ${ctaButton(`${SITE_URL.replace('rescuemanager.eu', 'admin.rescuemanager.eu')}/#/support`, 'Apri in Admin')}`,
  });
  return send(SUPPORT_INBOX, `[Supporto${t.isChat ? ' · CHAT' : ''}] #${num} ${t.subject}`, html, t.customer_email);
}

export function notifyStaffCustomerReply(t: {
  id: string; subject: string; customer_email: string; body: string;
}) {
  const num = ticketNo(t.id);
  const html = brandedEmail({
    title: `Nuova risposta cliente · ticket #${num}`,
    bodyHtml: `
      ${paragraph(`<b>${esc(t.subject)}</b> — ${esc(t.customer_email)}`)}
      ${quoteBox(t.body)}
      ${ctaButton(`${SITE_URL.replace('rescuemanager.eu', 'admin.rescuemanager.eu')}/#/support`, 'Apri in Admin')}`,
  });
  return send(SUPPORT_INBOX, `[Supporto] Re: #${num} ${t.subject}`, html, t.customer_email);
}
