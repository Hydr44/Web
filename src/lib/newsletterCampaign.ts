/**
 * Newsletter campaigns — template da eventi normativi + invio via Resend Broadcasts.
 *
 * - templateFromEvents: costruisce oggetto + HTML brandizzato da 1+ eventi
 *   regulatory_monitor (titolo, riassunto, link "Leggi la novità").
 * - createBroadcast / sendBroadcast: API Resend Broadcasts verso l'Audience.
 */

import { brandedHtml, BRAND, EMAIL_FONT, INK, INK_2, LINE } from '@/lib/email-template';

const RESEND_API = 'https://api.resend.com';
const FROM = process.env.NEWSLETTER_FROM || 'RescueManager <noreply@rescuemanager.eu>';

export interface RegEvent {
  id: string;
  group_label: string | null;
  label: string | null;
  url: string | null;
  added: unknown; // array di {url,title} oppure mappa {url:title}
  summary: string | null;
  detected_at: string;
}

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

/** Costruisce una bozza (title/subject/html) da uno o più eventi normativi. */
export function templateFromEvents(events: RegEvent[]): { title: string; subject: string; html: string } {
  const groups = Array.from(new Set(events.map((e) => e.group_label).filter(Boolean))) as string[];
  const subject = groups.length === 1 ? `Aggiornamento normativo ${groups[0]}` : 'Aggiornamenti normativi';
  const title = subject;

  // BOZZA EDITORIALE per il CLIENTE (non i dettagli tecnici del monitor).
  // La segnalazione del monitor è solo lo spunto: qui mettiamo un punto di
  // partenza in linguaggio cliente + la fonte ufficiale. Il team RIVEDE e
  // riscrive "Cosa cambia per te" prima dell'invio (i riferimenti tecnici
  // restano a lato nell'editor admin, non nell'email).
  // Una novità per blocco: titolo della novità, cosa cambia, fonte. Solo tabelle e stili in linea.
  const sections = events
    .map((e) => {
      const cosaCambia = e.summary
        ? esc(e.summary)
        : '[Spiega in 2-3 righe, in parole semplici, cosa cambia per il cliente e cosa deve fare.]';
      const occhiello = e.group_label
        ? `<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:13px;color:${INK_2};">${esc(e.group_label)}</p>`
        : '';
      const fonte = e.url
        ? `<p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;"><a href="${esc(e.url)}" style="color:${BRAND};text-decoration:none;">Leggi il documento ufficiale</a></p>`
        : '';
      return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;border-top:1px solid ${LINE};"><tr><td style="padding:16px 0 0;">
${occhiello}
<h2 style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:17px;font-weight:600;line-height:1.3;color:${INK};">${esc(e.label || 'Aggiornamento normativo')}</h2>
<p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:15px;line-height:1.6;color:${INK};">${cosaCambia}</p>
${fonte}
</td></tr></table>`;
    })
    .join('');

  const intro = 'Ecco le novità normative che riguardano la tua attività.';
  const html = brandedHtml(intro, {
    title,
    sub: groups.length ? groups.join(', ') : undefined,
    extraHtml: sections,
    cta: { href: 'https://rescuemanager.eu', label: 'Vedi come ti aiuta RescueManager' },
    reason: 'Ricevi questa email perché sei iscritto agli aggiornamenti RescueManager. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#ffffff;text-decoration:none;">Disiscriviti</a>',
  });

  return { title, subject, html };
}

/** Crea una Broadcast Resend sull'Audience configurata. Ritorna il broadcast id. */
export async function createBroadcast(opts: { subject: string; html: string; name: string }): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!key) throw new Error('RESEND_API_KEY non configurata');
  if (!audienceId) throw new Error('RESEND_AUDIENCE_ID non configurata: crea un\'Audience su Resend e imposta la variabile.');

  const r = await fetch(`${RESEND_API}/broadcasts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audience_id: audienceId, from: FROM, subject: opts.subject, html: opts.html, name: opts.name }),
  });
  if (!r.ok) throw new Error(`Resend createBroadcast ${r.status}: ${await r.text().catch(() => '')}`);
  const data = await r.json().catch(() => ({}));
  const id = data?.id || data?.data?.id;
  if (!id) throw new Error('Resend: broadcast id mancante nella risposta');
  return id;
}

/** Invia (subito) una Broadcast Resend. */
export async function sendBroadcast(broadcastId: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY non configurata');
  const r = await fetch(`${RESEND_API}/broadcasts/${broadcastId}/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!r.ok) throw new Error(`Resend sendBroadcast ${r.status}: ${await r.text().catch(() => '')}`);
}
