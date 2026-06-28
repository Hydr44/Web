import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DEFAULT_LEGAL_VERSION, DEFAULT_LEGAL_EFFECTIVE, isConsentStale } from '@/lib/legal';

export const runtime = 'nodejs';

/**
 * GET  /api/legal  → stato consenso dell'utente in sessione
 *                    { version, effective_date, accepted, needsConsent, dormant }
 * POST /api/legal  → registra l'accettazione della versione corrente
 *
 * La versione corrente è in system_settings.legal_policy (fallback ai default).
 * Se la tabella policy_acceptances non esiste ancora → dormant=true,
 * needsConsent=false (nessun blocco finché non viene creata).
 */
async function currentPolicy() {
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'legal_policy')
      .maybeSingle();
    const v = (data?.value || {}) as { version?: string; effective_date?: string; note?: string };
    return {
      version: v.version || DEFAULT_LEGAL_VERSION,
      effective_date: v.effective_date || DEFAULT_LEGAL_EFFECTIVE,
    };
  } catch {
    return { version: DEFAULT_LEGAL_VERSION, effective_date: DEFAULT_LEGAL_EFFECTIVE };
  }
}

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const policy = await currentPolicy();

  let accepted: string | null = null;
  let dormant = false;
  try {
    const { data, error } = await supabaseAdmin
      .from('policy_acceptances')
      .select('version')
      .eq('user_id', user.id)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) dormant = true;
    else accepted = data?.version ?? null;
  } catch {
    dormant = true;
  }

  return NextResponse.json({
    version: policy.version,
    effective_date: policy.effective_date,
    accepted,
    dormant,
    needsConsent: dormant ? false : isConsentStale(accepted, policy.version),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const policy = await currentPolicy();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const ua = request.headers.get('user-agent') || null;

  const { error } = await supabaseAdmin.from('policy_acceptances').insert({
    user_id: user.id,
    version: policy.version,
    ip,
    user_agent: ua,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, version: policy.version });
}
