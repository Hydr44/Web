import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const VALID_MODULES = ['sdi', 'rvfu', 'rentri', 'contabilita'];
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
      .select('id, org_id, plan, modules, expires_at, used_at, link_type, trial_days')
      .eq('token', token)
      .single();

    if (linkErr || !link) {
      return NextResponse.json(
        { ok: false, error: 'Link non valido o scaduto' },
        { status: 404, headers: corsHeaders(origin) }
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
    const linkType = link.link_type === 'purchase' ? 'purchase' : 'trial';

    if (linkType === 'purchase') {
      return NextResponse.json(
        { ok: false, error: 'Usa /info per purchase' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (link.used_at) {
      return NextResponse.json(
        { ok: false, error: 'Questo link trial è già stato utilizzato' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const rawModules = Array.isArray(link.modules) ? link.modules : [];
    const modules = rawModules.filter((m: string) => VALID_MODULES.includes(m));
    const PLAN_DEFAULT: Record<string, string[]> = {
      Starter: ['sdi'],
      Professional: ['sdi', 'rvfu'],
      Business: ['sdi', 'rvfu', 'rentri'],
      Full: ['sdi', 'rvfu', 'rentri', 'contabilita'],
    };
    const modulesToActivate = modules.length > 0 ? modules : (PLAN_DEFAULT[plan] || PLAN_DEFAULT.Full);
    const isoNow = now.toISOString();
    const trialDays = Math.min(90, Math.max(1, Number(link.trial_days) || 7));
    const periodEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from('org_subscriptions').upsert(
      {
        org_id: link.org_id,
        plan: plan.toLowerCase(),
        status: 'trial',
        billing_type: 'trial',
        current_period_end: periodEnd,
        trial_end: periodEnd,
        updated_at: isoNow,
      },
      { onConflict: 'org_id' }
    );

    const modExpiresAt = periodEnd;
    for (const mod of modulesToActivate) {
      await supabaseAdmin.from('org_modules').upsert(
        {
          org_id: link.org_id,
          module: mod,
          status: 'active',
          activated_at: isoNow,
          expires_at: modExpiresAt,
          updated_at: isoNow,
        },
        { onConflict: 'org_id,module' }
      );
    }

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
        message: `Trial di ${trialDays} giorni attivato`,
        org_name: org?.name,
        plan,
        modules: modulesToActivate,
        trial_days: trialDays,
        expires_at: periodEnd,
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
