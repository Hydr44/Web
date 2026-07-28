import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendCustomerEmail } from '@/lib/customer-email';
import type { BrandedEmailOpts } from '@/lib/email-template';

/**
 * Destinatari "clienti reali": account con email, esclusi staff e org demo,
 * email distinte. Cap a 2000 per sicurezza.
 */
export async function getClientRecipients(): Promise<{ email: string; nome: string }[]> {
  const out: { email: string; nome: string }[] = [];
  try {
    const { data: demoOrgs } = await supabaseAdmin.from('orgs').select('id').eq('is_demo', true);
    const demo = new Set((demoOrgs || []).map((o: { id: string }) => o.id));
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, is_staff, current_org')
      .not('email', 'is', null);
    const seen = new Set<string>();
    for (const p of (profiles || []) as {
      email?: string; full_name?: string; is_staff?: boolean; current_org?: string;
    }[]) {
      const email = (p.email || '').trim().toLowerCase();
      if (!email || p.is_staff) continue;
      if (p.current_org && demo.has(p.current_org)) continue;
      if (seen.has(email)) continue;
      seen.add(email);
      out.push({ email, nome: p.full_name || 'Cliente' });
    }
  } catch {
    return [];
  }
  return out.slice(0, 2000);
}

/**
 * Invia un'email branded (template del sito) a tutti i clienti reali.
 * Il body può usare {{nome}}. Best-effort, a gruppi di 20.
 */
export async function sendToAllClients(
  subject: string,
  body: string,
  opts: BrandedEmailOpts = {},
  excludeEmails?: Iterable<string>,
): Promise<{ sent: number; failed: number; total: number }> {
  const exclude = new Set(
    excludeEmails ? Array.from(excludeEmails, (e) => String(e).trim().toLowerCase()) : [],
  );
  let recipients = await getClientRecipients();
  if (exclude.size) recipients = recipients.filter((r) => !exclude.has(r.email));
  let sent = 0;
  let failed = 0;
  const CHUNK = 20;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const slice = recipients.slice(i, i + CHUNK);
    const results = await Promise.all(
      slice.map((r) =>
        sendCustomerEmail(r.email, subject, body, { nome: r.nome, ...opts }).catch(() => ({ ok: false as const })),
      ),
    );
    for (const r of results) {
      if (r.ok) sent++;
      else failed++;
    }
  }
  return { sent, failed, total: recipients.length };
}
