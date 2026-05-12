/**
 * GET /api/staff/admin/clients/:id
 * Detail completo cliente: org + subscription + membri (con profiles) +
 *   modules + settings + lead origin + sessions + invoice history.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  try {
    const orgId = params.id;

    // 1. Org base
    const { data: org, error: orgErr } = await supabaseAdmin
      .from('orgs')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ success: false, error: 'Cliente non trovato' }, { status: 404, headers: corsHeaders(origin) });
    }

    // 2. Subscription
    const { data: subscription } = await supabaseAdmin
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    // 3. Members + profili in unica query (join via in())
    const { data: orgMembers } = await supabaseAdmin
      .from('org_members')
      .select('user_id, role, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    const memberIds = (orgMembers || []).map(m => m.user_id);
    const profilesMap = new Map<string, any>();
    if (memberIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, avatar_url, created_at, updated_at, provider, onboarding_completed')
        .in('id', memberIds);
      for (const p of profiles || []) profilesMap.set(p.id, p);
    }
    const members = (orgMembers || []).map(m => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.created_at,
      profile: profilesMap.get(m.user_id) || null,
    }));

    // 4. Operators (per cross-check ruoli desktop)
    const { data: operators } = await supabaseAdmin
      .from('operators')
      .select('id, user_id, nome, cognome, email, ruolo, attivo, codice_operatore, created_at')
      .eq('org_id', orgId);

    // 5. Settings (company JSONB)
    const { data: settings } = await supabaseAdmin
      .from('org_settings')
      .select('key, value, updated_at')
      .eq('org_id', orgId);
    const settingsMap: Record<string, any> = {};
    for (const s of settings || []) settingsMap[s.key] = s.value;

    // 6. Modules attivi
    const { data: modules } = await supabaseAdmin
      .from('org_modules')
      .select('*')
      .eq('org_id', orgId);

    // 7. Lead origin
    let leadOrigin = null;
    if (org.converted_from_lead_id) {
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('id, name, company, email, phone, source, status, first_contact_at, converted_at, lead_score, utm_source, utm_campaign')
        .eq('id', org.converted_from_lead_id)
        .maybeSingle();
      leadOrigin = lead;
    }

    // 8. Sessioni recenti (ultimi 30 giorni, top 20)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: sessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id, user_id, ip_address, user_agent, started_at, last_activity_at, ended_at')
      .in('user_id', memberIds.length ? memberIds : ['00000000-0000-0000-0000-000000000000'])
      .gt('started_at', thirtyDaysAgo)
      .order('started_at', { ascending: false })
      .limit(20);

    // 9. Stats
    const activeMembersCount = members.length;
    const lastActivity = sessions && sessions.length > 0 ? sessions[0].started_at : null;

    const client = {
      // Identity
      id: org.id,
      name: settingsMap.company?.company_name || org.name,
      // Org native
      is_demo: org.is_demo,
      demo_expires_at: org.demo_expires_at,
      web_access_enabled: org.web_access_enabled,
      web_features: org.web_features,
      desktop_access_enabled: org.desktop_access_enabled,
      desktop_modules: org.desktop_modules,
      created_at: org.created_at,
      updated_at: org.updated_at,
      converted_from_lead_id: org.converted_from_lead_id,
      // Company
      company: settingsMap.company || null,
      // Features toggles (org_settings.features JSONB)
      features: settingsMap.features || null,
      // Tutte le settings (per altre key future)
      settings: settingsMap,
      // Subscription
      subscription,
      // Members
      members,
      member_count: activeMembersCount,
      // Operators desktop
      operators: operators || [],
      // Modules
      modules: modules || [],
      // Lead
      lead_origin: leadOrigin,
      // Activity
      recent_sessions: sessions || [],
      last_activity_at: lastActivity,
    };

    return NextResponse.json({ success: true, client }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    console.error('[admin client detail] error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
