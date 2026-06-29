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
import { brandedHtml } from '@/lib/email-template';

const RESEND_API = 'https://api.resend.com';
const FROM = process.env.NEWSLETTER_FROM || 'RescueManager <noreply@rescuemanager.eu>';

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

/** Email di conferma iscrizione — usa il template brand canonico (@/lib/email-template). */
export function confirmEmailHtml(confirmUrl: string): string {
  return brandedHtml(
    'Grazie per esserti iscritto alla newsletter di RescueManager.\nConferma il tuo indirizzo per ricevere novità su funzionalità e aggiornamenti normativi (RENTRI, SDI, RVFU).',
    {
      subtitle: 'Newsletter',
      cta: { href: confirmUrl, label: 'Conferma iscrizione' },
      footerNote: 'Se non ti sei iscritto tu, ignora questa email: senza conferma non riceverai nulla.',
    },
  );
}
