import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { DEFAULT_LEGAL_VERSION, DEFAULT_LEGAL_EFFECTIVE } from '@/lib/legal';
import { sendCustomerEmail } from '@/lib/customer-email';

export const runtime = 'nodejs';

/**
 * Gestione versione documenti legali (staff). L'auth staff JWT è applicata dal
 * middleware su /api/staff/admin/*.
 *
 * GET  → versione corrente + statistiche accettazione
 * POST → pubblica una nuova versione (alza la versione → tutti i clienti
 *        rivedono il consenso al prossimo accesso). { version, effective_date, note }
 */
async function readPolicy() {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('value, updated_at')
    .eq('key', 'legal_policy')
    .maybeSingle();
  const v = (data?.value || {}) as { version?: string; effective_date?: string; note?: string };
  return {
    version: v.version || DEFAULT_LEGAL_VERSION,
    effective_date: v.effective_date || DEFAULT_LEGAL_EFFECTIVE,
    note: v.note || null,
    updated_at: data?.updated_at || null,
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const policy = await readPolicy();

    let totalUsers = 0;
    let acceptedCurrent = 0;
    let tableMissing = false;
    try {
      const { count } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      totalUsers = count || 0;
      const { data: acc, error } = await supabaseAdmin
        .from('policy_acceptances')
        .select('user_id')
        .eq('version', policy.version);
      if (error) tableMissing = true;
      else acceptedCurrent = new Set((acc || []).map((a: { user_id: string }) => a.user_id)).size;
    } catch {
      tableMissing = true;
    }

    return NextResponse.json(
      { success: true, policy, stats: { totalUsers, acceptedCurrent, tableMissing } },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
    console.error('admin/legal GET error:', error);
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));
    const version = String(body.version || '').trim();
    const effective_date = String(body.effective_date || '').trim();
    const note = body.note ? String(body.note).slice(0, 500) : null;
    const notify = body.notify === true;

    if (!/^\d+\.\d+(\.\d+)?$/.test(version)) {
      return NextResponse.json(
        { success: false, error: 'Versione non valida (formato es. 3.1)' },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    // Non permettere di abbassare la versione (confronto semplice numerico).
    const current = await readPolicy();
    const cmp = compareV(version, current.version);
    if (cmp < 0) {
      return NextResponse.json(
        { success: false, error: `La nuova versione (${version}) non può essere precedente all'attuale (${current.version}).` },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const { error } = await supabaseAdmin.from('system_settings').upsert(
      {
        key: 'legal_policy',
        value: { version, effective_date: effective_date || null, note },
        description: 'Versione corrente documenti legali (Privacy/Cookie/Termini/DPA)',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    // Email di avviso ai clienti: solo se richiesto E se la versione è davvero
    // aumentata (no email sul re-salvataggio della stessa versione).
    let notified: { sent: number; failed: number; total: number } | null = null;
    if (notify && cmp > 0) {
      notified = await sendPolicyUpdateEmails(version, effective_date);
    }

    return NextResponse.json(
      { success: true, policy: { version, effective_date, note }, notified },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
    console.error('admin/legal POST error:', error);
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

function compareV(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number(n) || 0);
  const pb = b.split('.').map((n) => Number(n) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/**
 * Invia l'email di avviso aggiornamento legale ai clienti reali (no staff, no
 * org demo), email distinte. Best-effort: non lancia mai. Cap a 1000 destinatari.
 */
async function sendPolicyUpdateEmails(
  version: string,
  effectiveDate: string,
): Promise<{ sent: number; failed: number; total: number }> {
  let recipients: { email: string; nome: string }[] = [];
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
      recipients.push({ email, nome: p.full_name || 'Cliente' });
    }
  } catch {
    return { sent: 0, failed: 0, total: 0 };
  }

  recipients = recipients.slice(0, 1000);

  let effective = '';
  if (effectiveDate) {
    try { effective = new Date(effectiveDate).toLocaleDateString('it-IT'); } catch { effective = effectiveDate; }
  }

  const subject = `Aggiornamento delle condizioni di servizio (v${version})`;
  const body =
    `Gentile {{nome}},\n` +
    `abbiamo aggiornato i nostri documenti legali — Informativa Privacy, Cookie Policy, Termini di Servizio e Accordo sul Trattamento dei Dati (DPA)${effective ? `, in vigore dal ${effective}` : ''}.\n` +
    `\n` +
    `Al prossimo accesso alla dashboard ti chiederemo di confermare la presa visione e l'accettazione della nuova versione.\n` +
    `\n` +
    `Puoi consultare i documenti aggiornati:\n` +
    `Informativa Privacy — https://rescuemanager.eu/privacy-policy\n` +
    `Cookie Policy — https://rescuemanager.eu/cookie-policy\n` +
    `Termini di Servizio — https://rescuemanager.eu/terms-of-use\n` +
    `Trattamento Dati (DPA) — https://rescuemanager.eu/dpa`;

  let sent = 0;
  let failed = 0;
  const CHUNK = 20;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const slice = recipients.slice(i, i + CHUNK);
    const results = await Promise.all(
      slice.map((r) =>
        sendCustomerEmail(r.email, subject, body, {
          nome: r.nome,
          subtitle: 'Aggiornamento legale',
          cta: { href: 'https://rescuemanager.eu/dashboard', label: 'Vai alla dashboard' },
          footerNote: 'Ricevi questa email perché hai un account RescueManager.',
        }).catch(() => ({ ok: false as const })),
      ),
    );
    for (const r of results) {
      if (r.ok) sent++;
      else failed++;
    }
  }
  return { sent, failed, total: recipients.length };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
