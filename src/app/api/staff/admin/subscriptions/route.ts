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
