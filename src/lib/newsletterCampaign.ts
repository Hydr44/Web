/**
 * Newsletter campaigns — template da eventi normativi + invio via Resend Broadcasts.
 *
 * - templateFromEvents: costruisce oggetto + HTML brandizzato da 1+ eventi
 *   regulatory_monitor (titolo, riassunto, link "Leggi la novità").
 * - createBroadcast / sendBroadcast: API Resend Broadcasts verso l'Audience.
 */

import { brandedHtml, BRAND_BLUE } from '@/lib/email-template';

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
  const subject = groups.length === 1 ? `Aggiornamento normativo: ${groups[0]}` : 'Aggiornamenti normativi';
  const title = subject;

  // BOZZA EDITORIALE per il CLIENTE (non i dettagli tecnici del monitor).
  // La segnalazione del monitor è solo lo spunto: qui mettiamo un punto di
  // partenza in linguaggio cliente + la fonte ufficiale. Il team RIVEDE e
  // riscrive "Cosa cambia per te" prima dell'invio (i riferimenti tecnici
  // restano a lato nell'editor admin, non nell'email).
  const sections = events
    .map((e) => {
      const cosaCambia = e.summary
        ? esc(e.summary)
        : '[Spiega in 2-3 righe, in parole semplici, cosa cambia per il cliente e cosa deve fare.]';
      return `
      <div style="margin:0 0 22px;padding:0 0 18px;border-bottom:1px solid #e2e8f0;">
        ${e.group_label ? `<span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND_BLUE};margin-bottom:6px;">${esc(e.group_label)}</span>` : ''}
        <h2 style="margin:0 0 8px;font-size:17px;color:#0f172a;">${esc(e.label || 'Aggiornamento normativo')}</h2>
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;">Cosa cambia per te</p>
        <p style="margin:0 0 12px;font-size:15px;color:#475569;line-height:1.65;">${cosaCambia}</p>
        ${e.url ? `<a href="${esc(e.url)}" style="display:inline-block;font-size:13px;font-weight:600;color:${BRAND_BLUE};text-decoration:none;">Fonte ufficiale →</a>` : ''}
      </div>`;
    })
    .join('');

  const intro = 'Ti teniamo aggiornato sulle novità normative che riguardano la tua attività.';
  const html = brandedHtml(intro, {
    subtitle: 'Aggiornamento normativo',
    extraHtml: sections,
    cta: { href: 'https://rescuemanager.eu', label: 'Scopri come RescueManager ti aiuta' },
    footerNote: 'Ricevi questa email perché ti sei iscritto agli aggiornamenti RescueManager. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#94a3b8;">Disiscriviti</a>.',
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
