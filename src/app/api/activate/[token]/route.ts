import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const VALID_MODULES = ['sdi', 'rvfu', 'rentri'];
const VALID_PLANS = ['Starter', 'Professional', 'Business', 'Full'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Token mancante' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { data: link, error: linkErr } = await supabaseAdmin
      .from('plan_activation_links')
      .select('id, org_id, plan, modules, expires_at, used_at')
      .eq('token', token)
      .single();

    if (linkErr || !link) {
      return NextResponse.json(
        { ok: false, error: 'Link non valido o scaduto' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    if (link.used_at) {
      return NextResponse.json(
        { ok: false, error: 'Questo link è già stato utilizzato' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const now = new Date();
    if (new Date(link.expires_at) < now) {
      return NextResponse.json(
        { ok: false, error: 'Questo link è scaduto' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const plan = VALID_PLANS.includes(link.plan) ? link.plan : 'Starter';
    const rawModules = Array.isArray(link.modules) ? link.modules : [];
    const modules = rawModules.filter((m: string) => VALID_MODULES.includes(m));

    // Se non specificati, usa moduli di default per il piano
    const PLAN_DEFAULT: Record<string, string[]> = {
      Starter: ['sdi'],
      Professional: ['sdi', 'rvfu'],
      Business: ['sdi', 'rvfu', 'rentri'],
      Full: ['sdi', 'rvfu', 'rentri'],
    };
    const modulesToActivate = modules.length > 0 ? modules : (PLAN_DEFAULT[plan] || PLAN_DEFAULT.Full);
    const isoNow = now.toISOString();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Upsert org_subscriptions
    await supabaseAdmin.from('org_subscriptions').upsert(
      {
        org_id: link.org_id,
        plan,
        status: 'active',
        current_period_end: periodEnd,
        updated_at: isoNow,
      },
      { onConflict: 'org_id' }
    );

    // 2. Attiva moduli in org_modules
    for (const mod of modulesToActivate) {
      await supabaseAdmin.from('org_modules').upsert(
        {
          org_id: link.org_id,
          module: mod,
          status: 'active',
          activated_at: isoNow,
          expires_at: null,
          updated_at: isoNow,
        },
        { onConflict: 'org_id,module' }
      );
    }

    // 3. Aggiorna current_plan per owner dell'org
    const { data: owner } = await supabaseAdmin
      .from('org_members')
      .select('user_id')
      .eq('org_id', link.org_id)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle();
    if (owner?.user_id) {
      await supabaseAdmin
        .from('profiles')
        .update({ current_plan: plan, updated_at: isoNow })
        .eq('id', owner.user_id);
    }

    // 4. Marca link come usato
    await supabaseAdmin
      .from('plan_activation_links')
      .update({ used_at: isoNow })
      .eq('id', link.id);

    const { data: org } = await supabaseAdmin
      .from('orgs')
      .select('name')
      .eq('id', link.org_id)
      .single();

    return NextResponse.json(
      {
        ok: true,
        message: 'Piano attivato con successo',
        org_name: org?.name,
        plan,
        modules: modulesToActivate,
      },
      { headers: corsHeaders(origin) }
    );
  } catch (e) {
    console.error('[activate]', e);
    return NextResponse.json(
      { ok: false, error: 'Errore durante l\'attivazione' },
      { status: 500 }
    );
  }
}
