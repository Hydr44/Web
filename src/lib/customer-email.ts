// Email transazionali al cliente (F5) — via Supabase Edge Function `send-email`
// (Resend internamente), stesso pattern delle campagne lead. Best-effort: chi
// chiama NON deve fallire se l'email non parte.

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function buildHtml(bodyText: string, vars: { nome?: string; azienda?: string }): { html: string; text: string } {
  let text = bodyText;
  text = text.replace(/\{\{nome\}\}/gi, vars.nome || 'Cliente');
  text = text.replace(/\{\{azienda\}\}/gi, vars.azienda || '');

  const bodyHtml = text.split('\n').map((line) => {
    if (line.startsWith('•') || line.startsWith('-')) return `<li style="margin:4px 0;color:#333;">${line.replace(/^[•\-]\s*/, '')}</li>`;
    if (line.trim() === '') return '<br>';
    return `<p style="margin:0 0 8px;color:#333;font-size:15px;line-height:1.6;">${line}</p>`;
  }).join('\n');

  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#10b981);padding:28px 40px;border-radius:8px 8px 0 0;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">RescueManager</h1></td></tr>
<tr><td style="padding:36px 40px;">${bodyHtml}</td></tr>
<tr><td style="background:#f8f9fa;padding:18px 40px;border-radius:0 0 8px 8px;border-top:1px solid #e9ecef;">
<p style="margin:0;color:#999;font-size:12px;text-align:center;">&copy; ${year} RescueManager · <a href="https://rescuemanager.eu" style="color:#3b82f6;">rescuemanager.eu</a></p>
</td></tr></table></td></tr></table></body></html>`;
  return { html, text };
}

/** Invia un'email branded al cliente. Best-effort: ritorna {ok} senza lanciare. */
export async function sendCustomerEmail(
  to: string,
  subject: string,
  bodyText: string,
  vars: { nome?: string; azienda?: string } = {},
): Promise<{ ok: boolean; error?: string }> {
  if (!to) return { ok: false, error: 'no recipient' };
  try {
    const { html, text } = buildHtml(bodyText, vars);
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({ type: 'custom', to, subject, data: { html, text } }),
    });
    if (!res.ok) return { ok: false, error: await res.text().catch(() => 'send failed') };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send error' };
  }
}
