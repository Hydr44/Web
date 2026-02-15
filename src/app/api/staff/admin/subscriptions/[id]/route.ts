import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const PLAN_MODULES: Record<string, string[]> = {
  Starter: ['sdi'],
  Professional: ['sdi', 'rvfu'],
  Business: ['sdi', 'rvfu', 'rentri'],
  Full: ['sdi', 'rvfu', 'rentri'],
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const { id } = await params;

    // org_xxx => org_subscriptions
    if (id.startsWith('org_')) {
      const orgId = id.replace(/^org_/, '');
      const { data: orgSub, error: subErr } = await supabaseAdmin
        .from('org_subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle();

      if (subErr || !orgSub) {
        return NextResponse.json(
          { success: false, error: 'Abbonamento organizzazione non trovato' },
          { status: 404, headers: corsHeaders(origin) }
        );
      }

      const { data: org } = await supabaseAdmin
        .from('orgs')
        .select('id, name, email')
        .eq('id', orgId)
        .single();

      const { data: modules } = await supabaseAdmin
        .from('org_modules')
        .select('module, status, activated_at, expires_at')
        .eq('org_id', orgId);

      const planModules = PLAN_MODULES[orgSub.plan] || [];

      return NextResponse.json(
        {
          success: true,
          subscription: {
            id,
            source: 'org_subscriptions',
            plan: orgSub.plan,
            status: orgSub.status,
            current_period_end: orgSub.current_period_end,
            updated_at: orgSub.updated_at,
            plan_name: orgSub.plan,
            org_id: orgId,
            org_name: org?.name,
            org_email: org?.email,
            user_id: null,
            user_name: null,
            user_email: null,
            stripe_customer_id: orgSub.stripe_customer_id,
            stripe_subscription_id: orgSub.stripe_subscription_id,
            modules: modules || [],
            plan_modules: planModules,
          },
        },
        { headers: corsHeaders(origin) }
      );
    }

    // UUID => subscriptions (user-based)
    const { data: sub, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (subErr || !sub) {
      return NextResponse.json(
        { success: false, error: 'Abbonamento non trovato' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const PLAN_MAP: Record<string, string> = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || '']: 'Starter',
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || '']: 'Professional',
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL || '']: 'Business',
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL || '']: 'Full',
    };
    const planName = PLAN_MAP[sub.price_id || ''] || sub.price_id || '—';
    const planModules = PLAN_MODULES[planName] || [];

    let user_name: string | null = null;
    let user_email: string | null = null;
    let org_id: string | null = null;
    let org_name: string | null = null;

    if (sub.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email, current_org')
        .eq('id', sub.user_id)
        .single();
      user_name = profile?.full_name || null;
      user_email = profile?.email || null;
      if (profile?.current_org) {
        const { data: org } = await supabaseAdmin
          .from('orgs')
          .select('name')
          .eq('id', profile.current_org)
          .single();
        org_id = profile.current_org;
        org_name = org?.name || null;
      }
    }

    return NextResponse.json(
      {
        success: true,
        subscription: {
          id: sub.id,
          source: 'subscriptions',
          plan: planName,
          status: sub.status,
          current_period_end: sub.current_period_end,
          created_at: sub.created_at,
          updated_at: sub.updated_at,
          plan_name: planName,
          org_id,
          org_name,
          user_id: sub.user_id,
          user_name,
          user_email,
          stripe_customer_id: sub.stripe_customer_id,
          stripe_subscription_id: sub.stripe_subscription_id,
          price_id: sub.price_id,
          plan_modules: planModules,
          modules: [],
        },
      },
      { headers: corsHeaders(origin) }
    );
  } catch (error: unknown) {
    console.error('Admin subscription detail error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
