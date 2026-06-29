/**
 * Newsletter campaigns — template da eventi normativi + invio via Resend Broadcasts.
 *
 * - templateFromEvents: costruisce oggetto + HTML brandizzato da 1+ eventi
 *   regulatory_monitor (titolo, riassunto, link "Leggi la novità").
 * - createBroadcast / sendBroadcast: API Resend Broadcasts verso l'Audience.
 */

const RESEND_API = 'https://api.resend.com';
const FROM = process.env.NEWSLETTER_FROM || 'RescueManager <noreply@rescuemanager.eu>';
const BRAND_DARK = '#0f172a';
const BRAND_BLUE = '#2563eb';

export interface RegEvent {
  id: string;
  group_label: string | null;
  label: string | null;
  url: string | null;
  added: unknown; // array di {url,title} oppure mappa {url:title}
  summary: string | null;
  detected_at: string;
}

function addedToLinks(added: unknown): { url: string; title: string }[] {
  if (!added) return [];
  if (Array.isArray(added)) {
    return added
      .map((a: any) => (typeof a === 'object' && a ? { url: a.url || '', title: a.title || a.url || '' } : null))
      .filter((x): x is { url: string; title: string } => !!x && !!x.url);
  }
  if (typeof added === 'object') {
    return Object.entries(added as Record<string, string>).map(([url, title]) => ({ url, title: title || url }));
  }
  return [];
}

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

/** Costruisce una bozza (title/subject/html) da uno o più eventi normativi. */
export function templateFromEvents(events: RegEvent[]): { title: string; subject: string; html: string } {
  const groups = Array.from(new Set(events.map((e) => e.group_label).filter(Boolean))) as string[];
  const subject =
    events.length === 1 && events[0].label
      ? `Novità ${events[0].group_label || ''}: ${events[0].label}`.trim()
      : `Aggiornamenti normativi${groups.length ? ' — ' + groups.join(', ') : ''}`;
  const title = subject;

  const sections = events
    .map((e) => {
      const links = addedToLinks(e.added)
        .slice(0, 8)
        .map(
          (l) =>
            `<li style="margin:0 0 6px;"><a href="${esc(l.url)}" style="color:${BRAND_BLUE};text-decoration:none;">${esc(l.title)}</a></li>`,
        )
        .join('');
      return `
      <div style="margin:0 0 22px;padding:0 0 18px;border-bottom:1px solid #e2e8f0;">
        ${e.group_label ? `<span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND_BLUE};margin-bottom:6px;">${esc(e.group_label)}</span>` : ''}
        <h2 style="margin:0 0 8px;font-size:16px;color:#0f172a;">${esc(e.label || 'Aggiornamento')}</h2>
        ${e.summary ? `<p style="margin:0 0 10px;font-size:14px;color:#475569;line-height:1.6;">${esc(e.summary)}</p>` : ''}
        ${links ? `<ul style="margin:0 0 12px;padding-left:18px;">${links}</ul>` : ''}
        ${e.url ? `<a href="${esc(e.url)}" style="display:inline-block;font-size:13px;font-weight:600;color:${BRAND_BLUE};text-decoration:none;">Leggi la novità →</a>` : ''}
      </div>`;
    })
    .join('');

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:${BRAND_DARK};padding:24px 32px;">
          <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">RESCUE<span style="color:${BRAND_BLUE};">MANAGER</span></span>
        </td></tr>
        <tr><td style="padding:30px 32px 8px;">
          ${sections}
        </td></tr>
        <tr><td style="background:${BRAND_DARK};padding:18px 32px;border-top:3px solid ${BRAND_BLUE};">
          <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.45);text-align:center;">
            RescueManager · <a href="https://rescuemanager.eu" style="color:${BRAND_BLUE};text-decoration:none;">rescuemanager.eu</a>
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);text-align:center;">
            Non vuoi più ricevere queste email? <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:rgba(255,255,255,0.6);">Disiscriviti</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

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
