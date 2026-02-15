import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const { id: orgId } = await params;
    
    console.log(`Admin get organization API called for: ${orgId}`);
    
    // Carica organizzazione
    const { data: org, error: orgError } = await supabaseAdmin
      .from('orgs')
      .select('*')
      .eq('id', orgId)
      .single();
    
    if (orgError || !org) {
      return NextResponse.json({
        success: false,
        error: 'Organizzazione non trovata'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }
    
    // Conta membri
    const { count: memberCount } = await supabaseAdmin
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);
    
    // Abbonamento da org_subscriptions + fallback
    let subscription: { plan: string; status: string; current_period_end: string | null } | null = null;
    const { data: orgSub } = await supabaseAdmin
      .from('org_subscriptions')
      .select('plan, status, current_period_end')
      .eq('org_id', orgId)
      .maybeSingle();
    if (orgSub) {
      subscription = orgSub;
    } else {
      const { data: owner } = await supabaseAdmin
        .from('org_members')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle();
      if (owner?.user_id) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('current_plan')
          .eq('id', owner.user_id)
          .single();
        if (profile?.current_plan) {
          subscription = { plan: profile.current_plan, status: 'active', current_period_end: null };
        }
      }
    }
    const { data: settings } = await supabaseAdmin
      .from('company_settings')
      .select('company_code')
      .eq('org_id', orgId)
      .maybeSingle();
    
    const organization = {
      id: org.id,
      name: org.name,
      email: org.email || null,
      phone: org.phone || null,
      address: org.address || null,
      website: org.website || null,
      vat: org.vat || null,
      tax_code: org.tax_code || null,
      description: org.description || null,
      created_at: org.created_at,
      updated_at: org.updated_at || null,
      created_by: org.created_by || null,
      member_count: memberCount || 0,
      status: org.is_active !== false ? 'active' : 'inactive',
      subscription,
      company_code: settings?.company_code || null,
    };
    
    return NextResponse.json({
      success: true,
      organization
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin get organization API error:', error);
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
