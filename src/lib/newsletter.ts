/**
 * Newsletter — helper lato server (Resend).
 *
 * - sendEmail: invio via Resend REST (stesso meccanismo di /api/contact).
 * - addToAudience / unsubscribeFromAudience: sincronizza il contatto sulla
 *   Resend Audience (da cui si inviano le Broadcast). Richiede RESEND_AUDIENCE_ID;
 *   se assente, fa no-op con warning (il contatto resta comunque in Supabase).
 * - email brandizzata (double opt-in) coerente col resto del sito.
 */
import crypto from 'crypto';

const RESEND_API = 'https://api.resend.com';
const FROM = process.env.NEWSLETTER_FROM || 'RescueManager <noreply@rescuemanager.eu>';
const BRAND_DARK = '#0f172a';
const BRAND_BLUE = '#2563eb';

export function newToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[newsletter] RESEND_API_KEY assente: email non inviata');
    return false;
  }
  try {
    const r = await fetch(`${RESEND_API}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!r.ok) {
      console.error('[newsletter] invio fallito', r.status, await r.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[newsletter] invio errore', e);
    return false;
  }
}

/** Aggiunge/riattiva il contatto sull'Audience Resend. Ritorna il contact id. */
export async function addToAudience(email: string): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audienceId) {
    console.warn('[newsletter] RESEND_AUDIENCE_ID non configurato: contatto solo in Supabase');
    return null;
  }
  try {
    const r = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    if (!r.ok) {
      console.error('[newsletter] addToAudience fallito', r.status, await r.text().catch(() => ''));
      return null;
    }
    const data = await r.json().catch(() => ({}));
    return data?.id || data?.data?.id || null;
  } catch (e) {
    console.error('[newsletter] addToAudience errore', e);
    return null;
  }
}

/** Marca il contatto come unsubscribed sull'Audience Resend. */
export async function unsubscribeFromAudience(email: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audienceId) return;
  try {
    await fetch(`${RESEND_API}/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unsubscribed: true }),
    });
  } catch (e) {
    console.error('[newsletter] unsubscribeFromAudience errore', e);
  }
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:${BRAND_DARK};padding:24px 32px;">
          <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">RESCUE<span style="color:${BRAND_BLUE};">MANAGER</span></span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:19px;color:#0f172a;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="background:${BRAND_DARK};padding:18px 32px;border-top:3px solid ${BRAND_BLUE};">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);text-align:center;">
            RescueManager · <a href="https://rescuemanager.eu" style="color:${BRAND_BLUE};text-decoration:none;">rescuemanager.eu</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export function confirmEmailHtml(confirmUrl: string): string {
  return shell(
    'Conferma la tua iscrizione',
    `<p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
       Grazie per esserti iscritto alla newsletter di RescueManager. Conferma il tuo indirizzo
       per ricevere novità su funzionalità, normativa (RENTRI, SDI, RVFU) e aggiornamenti.
     </p>
     <a href="${confirmUrl}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:9px;">Conferma iscrizione</a>
     <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
       Se non sei stato tu, ignora questa email: senza conferma non riceverai nulla.
     </p>`,
  );
}
