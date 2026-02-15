import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin subscriptions API called');
    
    const PLAN_MAPPING: Record<string, string> = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || ""]: "Starter",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || ""]: "Professional",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL || ""]: "Business",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL || ""]: "Full",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || ""]: "Starter",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY || ""]: "Professional",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY || ""]: "Business",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY || ""]: "Full",
    };

    // 1) Abbonamenti user-based (subscriptions)
    const { data: userSubs, error: userErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, stripe_customer_id, stripe_subscription_id, price_id, status, current_period_end, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (userErr) {
      console.error('Error fetching subscriptions:', userErr);
    }

    const userIds = [...new Set((userSubs || []).map((s: any) => s.user_id).filter(Boolean))];
    const profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      (profiles || []).forEach((p: any) => { profilesMap[p.id] = p; });
    }

    const fromUser = (userSubs || []).map((sub: any) => {
      const profile = sub.user_id ? profilesMap[sub.user_id] : null;
      const planName = PLAN_MAPPING[sub.price_id || ""] || sub.price_id || "Sconosciuto";
      return {
        id: sub.id,
        user_id: sub.user_id,
        org_id: null,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        price_id: sub.price_id,
        status: sub.status,
        current_period_end: sub.current_period_end,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        plan_name: planName,
        user_email: profile?.email || null,
        user_name: profile?.full_name || null,
        source: 'subscriptions' as const,
      };
    });

    // 2) Abbonamenti org-based (org_subscriptions: simulate-plan, webhook Stripe)
    const { data: orgSubs, error: orgErr } = await supabaseAdmin
      .from('org_subscriptions')
      .select('org_id, plan, status, current_period_end, updated_at')
      .in('status', ['active', 'trialing']);

    if (orgErr) {
      console.error('Error fetching org_subscriptions:', orgErr);
    }

    const orgIds = [...new Set((orgSubs || []).map((s: any) => s.org_id).filter(Boolean))];
    const orgsMap: Record<string, { name: string; owner_email?: string }> = {};
    if (orgIds.length > 0) {
      const { data: orgs } = await supabaseAdmin.from('orgs').select('id, name').in('id', orgIds);
      (orgs || []).forEach((o: any) => { orgsMap[o.id] = { name: o.name || '—' }; });
      const { data: owners } = await supabaseAdmin
        .from('org_members')
        .select('org_id, user_id')
        .in('org_id', orgIds)
        .eq('role', 'owner');
      const ownerIds = [...new Set((owners || []).map((o: any) => o.user_id).filter(Boolean))];
      if (ownerIds.length > 0) {
        const { data: ownerProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .in('id', ownerIds);
        const ownerByUserId: Record<string, string> = {};
        (ownerProfiles || []).forEach((p: any) => { ownerByUserId[p.id] = p.email || ''; });
        (owners || []).forEach((o: any) => {
          if (orgsMap[o.org_id]) orgsMap[o.org_id].owner_email = ownerByUserId[o.user_id];
        });
      }
    }

    const fromOrg = (orgSubs || []).map((s: any) => {
      const org = orgsMap[s.org_id] || { name: '—', owner_email: null };
      return {
        id: `org_${s.org_id}`,
        user_id: null,
        org_id: s.org_id,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        price_id: null,
        status: s.status,
        current_period_end: s.current_period_end,
        created_at: s.updated_at,
        updated_at: s.updated_at,
        plan_name: s.plan || '—',
        user_email: org.owner_email || null,
        user_name: org.name,
        source: 'org_subscriptions' as const,
      };
    });

    const allSubscriptions = [...fromOrg, ...fromUser].sort(
      (a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    );

    return NextResponse.json({ 
      success: true, 
      subscriptions: allSubscriptions 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin subscriptions API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}
