import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const userId = params.id;
    
    console.log(`Admin get user API called for: ${userId}`);
    
    // Carica profilo utente
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Utente non trovato'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }
    
    // Carica organizzazione se presente
    let orgName = null;
    if (profile.current_org) {
      const { data: org } = await supabaseAdmin
        .from('orgs')
        .select('name')
        .eq('id', profile.current_org)
        .single();
      
      if (org) {
        orgName = org.name;
      }
    }
    
    // Carica abbonamento (da org_subscriptions se ha current_org)
    let currentPlan = null;
    if (profile.current_org) {
      const { data: orgSub } = await supabaseAdmin
        .from('org_subscriptions')
        .select('plan, status')
        .eq('org_id', profile.current_org)
        .maybeSingle();
      if (orgSub?.plan) currentPlan = orgSub.plan;
    }
    if (!currentPlan && profile.stripe_customer_id) {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('price_id, status')
        .eq('stripe_customer_id', profile.stripe_customer_id)
        .eq('status', 'active')
        .single();
      if (subscription) currentPlan = subscription.price_id;
    }

    // Carica tutte le organizzazioni dell'utente con ruolo
    const { data: orgMembers } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role, created_at')
      .eq('user_id', userId);
    const orgIds = (orgMembers || []).map(m => m.org_id).filter(Boolean);
    let orgsWithNames: Array<{ org_id: string; org_name: string; role: string; joined_at: string }> = [];
    if (orgIds.length > 0) {
      const { data: orgsData } = await supabaseAdmin
        .from('orgs')
        .select('id, name')
        .in('id', orgIds);
      const orgMap = new Map((orgsData || []).map(o => [o.id, o.name]));
      orgsWithNames = (orgMembers || []).map(m => ({
        org_id: m.org_id,
        org_name: orgMap.get(m.org_id) || '—',
        role: m.role,
        joined_at: m.created_at
      }));
    }
    
    const user = {
      id: profile.id,
      email: profile.email || '',
      full_name: profile.full_name || '',
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      last_sign_in_at: profile.last_sign_in_at,
      last_active: profile.last_active,
      org_id: profile.current_org,
      current_org: profile.current_org,
      org_name: orgName,
      status: profile.is_suspended ? 'suspended' : (profile.is_active !== false ? 'active' : 'inactive'),
      current_plan: currentPlan,
      stripe_customer_id: profile.stripe_customer_id,
      org_memberships: orgsWithNames
    };
    
    return NextResponse.json({
      success: true,
      user
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin get user API error:', error);
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
