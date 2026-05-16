/**
 * Helper invio email per il sistema di supporto.
 * Mittente dedicato: supporto@rescuemanager.eu (graceful no-op se RESEND_API_KEY assente).
 */

const SUPPORT_FROM = 'Supporto RescueManager <supporto@rescuemanager.eu>';
const SUPPORT_INBOX = 'supporto@rescuemanager.eu';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu').replace(/\/$/, '');

const ticketUrl = (id: string) => `${SITE_URL}/dashboard/support/${id}`;

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px">${label}</a>`;
}

function wrap(title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html lang="it"><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#0f172a;padding:20px 28px"><span style="color:#fff;font-weight:700;font-size:16px">RescueManager · Supporto</span></div>
    <div style="padding:28px">
      <h2 style="margin:0 0 16px;font-size:18px">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px">
      Email automatica · RescueManager SRL · supporto@rescuemanager.eu
    </div>
  </div></body></html>`;
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
      const txt = await r.text();
      console.error('[support-email] Resend KO:', r.status, txt);
      return { ok: false as const, error: `${r.status}: ${txt}` };
    }
    return { ok: true as const };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[support-email] network error:', msg);
    return { ok: false as const, error: msg };
  }
}

const esc = (s: string) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nl2br = (s: string) => esc(s).replaceAll('\n', '<br>');

/** Notifica allo staff: nuovo ticket aperto da un cliente. */
export function notifyStaffNewTicket(t: {
  id: string; subject: string; category: string; customer_email: string; customer_name?: string | null; body: string;
}) {
  const html = wrap('Nuovo ticket di supporto', `
    <p style="margin:0 0 8px"><b>Oggetto:</b> ${esc(t.subject)}</p>
    <p style="margin:0 0 8px"><b>Categoria:</b> ${esc(t.category)}</p>
    <p style="margin:0 0 8px"><b>Cliente:</b> ${esc(t.customer_name || '-')} &lt;${esc(t.customer_email)}&gt;</p>
    <p style="margin:0 0 4px"><b>Messaggio:</b></p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:14px">${nl2br(t.body)}</div>
    <p style="margin:16px 0 0;color:#64748b;font-size:12px">Ticket #${t.id.slice(0, 8)}</p>`);
  return send(SUPPORT_INBOX, `[Supporto] ${t.subject}`, html, t.customer_email);
}

/** Notifica allo staff: il cliente ha risposto su un ticket esistente. */
export function notifyStaffCustomerReply(t: {
  id: string; subject: string; customer_email: string; body: string;
}) {
  const html = wrap('Nuova risposta cliente', `
    <p style="margin:0 0 8px"><b>Ticket:</b> ${esc(t.subject)} (#${t.id.slice(0, 8)})</p>
    <p style="margin:0 0 8px"><b>Cliente:</b> ${esc(t.customer_email)}</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:14px">${nl2br(t.body)}</div>`);
  return send(SUPPORT_INBOX, `[Supporto] Re: ${t.subject}`, html, t.customer_email);
}

/** Notifica al cliente: ticket aperto/ricevuto. */
export function notifyCustomerTicketOpened(t: {
  id: string; subject: string; customer_email: string;
}) {
  const num = t.id.slice(0, 8).toUpperCase();
  const html = wrap(`Ticket aperto #${num}`, `
    <p style="margin:0 0 8px">Abbiamo ricevuto la tua richiesta di supporto:</p>
    <p style="margin:0 0 4px"><b>Oggetto:</b> ${esc(t.subject)}</p>
    <p style="margin:0 0 4px"><b>Numero ticket:</b> #${num}</p>
    <p style="margin:12px 0 0;font-size:14px">Ti risponderemo al più presto. Puoi seguire la conversazione e rispondere dalla tua area riservata.</p>
    ${ctaButton(ticketUrl(t.id), 'Vai al ticket')}`);
  return send(t.customer_email, `Ticket aperto #${num}: ${t.subject}`, html, SUPPORT_INBOX);
}

/** Notifica al cliente: lo staff ha risposto. */
export function notifyCustomerStaffReply(t: {
  id: string; subject: string; customer_email: string; body: string;
}) {
  const html = wrap('Abbiamo risposto al tuo ticket', `
    <p style="margin:0 0 12px">Abbiamo risposto alla tua richiesta <b>"${esc(t.subject)}"</b>:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:14px">${nl2br(t.body)}</div>
    <p style="margin:16px 0 0;font-size:13px;color:#475569">Accedi all'area riservata per vedere la risposta completa, eventuali allegati e rispondere.</p>
    ${ctaButton(ticketUrl(t.id), 'Apri il ticket e rispondi')}`);
  return send(t.customer_email, `Re: ${t.subject} — Supporto RescueManager`, html, SUPPORT_INBOX);
}

/** Notifica al cliente: ticket risolto/chiuso. */
export function notifyCustomerStatus(t: {
  subject: string; customer_email: string; status: string;
}) {
  const label = t.status === 'resolved' ? 'risolto' : 'chiuso';
  const html = wrap(`Ticket ${label}`, `
    <p style="margin:0">La tua richiesta <b>"${esc(t.subject)}"</b> è stata contrassegnata come <b>${label}</b>.</p>
    <p style="margin:12px 0 0;font-size:13px;color:#475569">Se hai ancora bisogno di assistenza, puoi riaprire il ticket rispondendo dalla sezione Supporto.</p>`);
  return send(t.customer_email, `Ticket ${label}: ${t.subject}`, html, SUPPORT_INBOX);
}
