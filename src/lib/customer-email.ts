// Email transazionali al cliente (F5) — via Supabase Edge Function `send-email`.
// Usa il template brandizzato condiviso (vedi lib/email-template.ts). Best-effort:
// chi chiama NON deve fallire se l'email non parte.
import { brandedHtml, type BrandedEmailOpts } from '@/lib/email-template';

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

type EmailVars = BrandedEmailOpts & { nome?: string; azienda?: string };

/** Invia un'email branded al cliente. Best-effort: ritorna {ok} senza lanciare. */
export async function sendCustomerEmail(
  to: string,
  subject: string,
  bodyText: string,
  vars: EmailVars = {},
): Promise<{ ok: boolean; error?: string }> {
  if (!to) return { ok: false, error: 'no recipient' };
  try {
    const text = bodyText
      .replace(/\{\{nome\}\}/gi, vars.nome || 'Cliente')
      .replace(/\{\{azienda\}\}/gi, vars.azienda || '');
    const html = brandedHtml(text, vars);
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
