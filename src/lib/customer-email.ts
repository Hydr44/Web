// Email transazionali al cliente (F5) — via Supabase Edge Function `send-email`.
// Usa il template brandizzato condiviso (vedi lib/email-template.ts). Best-effort:
// chi chiama NON deve fallire se l'email non parte.
import { brandedHtml, type BrandedEmailOpts } from '@/lib/email-template';

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

type EmailVars = BrandedEmailOpts & {
  nome?: string;
  azienda?: string;
  /** Indirizzo a cui far arrivare le risposte (l'azienda cliente, quando scriviamo per conto suo). */
  replyTo?: string;
};

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

    // Quando l'email parte per conto di un'azienda cliente, il nome mostrato lo dice
    // ("Azienda via RescueManager") e le risposte vanno all'azienda, non a noi.
    // `sender_name` e `reply_to` sono facoltativi: chi non li conosce li ignora.
    const senderName = vars.sender ? `${vars.sender} via RescueManager` : undefined;
    const data: Record<string, unknown> = { html, text };
    if (senderName) data.sender_name = senderName;
    if (vars.replyTo) data.reply_to = vars.replyTo;

    const payload: Record<string, unknown> = { type: 'custom', to, subject, data };
    if (senderName) payload.sender_name = senderName;
    if (vars.replyTo) payload.reply_to = vars.replyTo;

    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: await res.text().catch(() => 'send failed') };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send error' };
  }
}
