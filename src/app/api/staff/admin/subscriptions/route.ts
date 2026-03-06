import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');

    // Recupera abbonamenti da org_subscriptions (tabella reale)
    const { data: subscriptions, error } = await supabaseAdmin
      .from('org_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching org_subscriptions:', error);
      return NextResponse.json({
        success: false,
        error: 'Errore nel recupero degli abbonamenti',
        details: error.message,
      }, { status: 500, headers: corsHeaders(origin) });
    }

    // Recupera nomi org
    const orgIds = [...new Set((subscriptions || []).map((s: any) => s.org_id).filter(Boolean))];
    const orgsMap: Record<string, any> = {};

    if (orgIds.length > 0) {
      const { data: orgs } = await supabaseAdmin
        .from('orgs')
        .select('id, name')
        .in('id', orgIds);
      if (orgs) {
        orgs.forEach((o: any) => { orgsMap[o.id] = o; });
      }
    }

    // Recupera owner di ogni org per mostrare email/nome
    const ownersMap: Record<string, any> = {};
    if (orgIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from('org_members')
        .select('org_id, user_id, role')
        .in('org_id', orgIds)
        .eq('role', 'owner');

      if (members && members.length > 0) {
        const ownerUserIds = members.map((m: any) => m.user_id);
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name')
          .in('id', ownerUserIds);

        if (profiles) {
          const profileMap: Record<string, any> = {};
          profiles.forEach((p: any) => { profileMap[p.id] = p; });
          members.forEach((m: any) => {
            ownersMap[m.org_id] = profileMap[m.user_id] || null;
          });
        }
      }
    }

    // Recupera moduli attivi per ogni org
    const modulesMap: Record<string, string[]> = {};
    if (orgIds.length > 0) {
      const { data: mods } = await supabaseAdmin
        .from('org_modules')
        .select('org_id, module, status')
        .in('org_id', orgIds)
        .eq('status', 'active');
      if (mods) {
        mods.forEach((m: any) => {
          if (!modulesMap[m.org_id]) modulesMap[m.org_id] = [];
          modulesMap[m.org_id].push(m.module);
        });
      }
    }

    const PLAN_LABELS: Record<string, string> = {
      starter: 'Starter', professional: 'Professional',
      business: 'Business', full: 'Full',
    };

    const transformed = (subscriptions || []).map((sub: any) => {
      const org = orgsMap[sub.org_id];
      const owner = ownersMap[sub.org_id];
      return {
        id: sub.org_id,
        org_id: sub.org_id,
        org_name: org?.name || '—',
        plan: sub.plan,
        plan_name: PLAN_LABELS[sub.plan] || sub.plan || '—',
        status: sub.status,
        billing_type: sub.billing_type || 'manual',
        current_period_end: sub.current_period_end,
        trial_end: sub.trial_end,
        stripe_subscription_id: sub.stripe_subscription_id,
        is_custom: sub.is_custom,
        custom_notes: sub.custom_notes,
        modules: modulesMap[sub.org_id] || [],
        owner_email: owner?.email || null,
        owner_name: owner?.full_name || null,
        created_at: sub.created_at || sub.updated_at,
        updated_at: sub.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      subscriptions: transformed,
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin subscriptions API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server',
    }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();
    const { org_id, plan, billing_type, status, trial_days, notes } = body;

    if (!org_id || !plan) {
      return NextResponse.json({
        success: false, error: 'org_id e plan sono richiesti'
      }, { status: 400, headers: corsHeaders(origin) });
    }

    // Calculate dates based on billing type
    const now = new Date();
    let trialEnd = null;
    let periodEnd = null;

    if (status === 'trial' || billing_type === 'trial') {
      const days = trial_days || 14;
      trialEnd = new Date(now.getTime() + days * 86400000).toISOString();
      periodEnd = trialEnd;
    } else {
      // Default 1 year for manual subscriptions
      periodEnd = new Date(now.getTime() + 365 * 86400000).toISOString();
    }

    // Upsert subscription (one per org)
    const { data: sub, error } = await supabaseAdmin
      .from('org_subscriptions')
      .upsert({
        org_id,
        plan,
        status: status || 'active',
        billing_type: billing_type || 'manual',
        trial_end: trialEnd,
        current_period_end: periodEnd,
        custom_notes: notes || null,
        updated_at: now.toISOString(),
      }, { onConflict: 'org_id' })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json({
        success: false, error: `Errore creazione abbonamento: ${error.message}`
      }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({
      success: true,
      subscription: sub,
      message: 'Abbonamento creato con successo'
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin create subscription error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      success: false, error: 'Errore interno del server'
    }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
