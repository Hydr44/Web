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

    // Ultimo login REALE da auth.users. `user_sessions` non è affidabile
    // (schema diverso: manca started_at) → prima last_access risultava vuoto
    // anche se l'utente aveva fatto accesso. getUserById per ogni membro
    // (pochi) → mappa id → last_sign_in_at.
    const lastSignInMap = new Map<string, string | null>();
    await Promise.all(
      memberIds.map(async (uid) => {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
          lastSignInMap.set(uid, data?.user?.last_sign_in_at ?? null);
        } catch {
          /* ignora singolo */
        }
      }),
    );
    for (const m of members) (m as any).last_sign_in_at = lastSignInMap.get(m.user_id) ?? null;
    const lastLoginAll = [...lastSignInMap.values()].filter(Boolean).sort().pop() || null;

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

    // 8b. Ultimo accesso ALL-TIME (non solo 30gg) + conteggi utilizzo del gestionale.
    //     Tutto server-side con service role → conta anche cross-org.
    const { data: lastSession } = await supabaseAdmin
      .from('user_sessions')
      .select('started_at')
      .in('user_id', memberIds.length ? memberIds : ['00000000-0000-0000-0000-000000000000'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Conteggio robusto: se una tabella non esiste/ha errore ritorna 0 (niente 500).
    const countOf = async (table: string) => {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId);
        return error ? 0 : (count ?? 0);
      } catch {
        return 0;
      }
    };
    const [transportsCount, vehiclesCount, clientsCount, driversCount, invoicesCount] = await Promise.all([
      countOf('transports'),
      countOf('vehicles'),
      countOf('clients'),
      countOf('staff_drivers'),
      countOf('invoices'),
    ]);
    const { count: transports30dRaw } = await supabaseAdmin
      .from('transports')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gt('created_at', thirtyDaysAgo);

    // 9. Stats
    const activeMembersCount = members.length;
    const lastActivity = sessions && sessions.length > 0 ? sessions[0].started_at : null;
    // Ultimo accesso: prima il login reale da auth, poi eventuali sessioni.
    const lastAccessAt = lastLoginAll || lastSession?.started_at || lastActivity;

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
      // Company — merge con sdi/billing per dati frammentati (PEC, regime_fiscale, ecc.)
      // Da Maggio 2026 desktop salva PEC/regime/IBAN in chiavi separate (sdi, billing).
      // Componiamo una vista unificata per l'admin UI.
      company: {
        ...(settingsMap.company || {}),
        // Override con valori più freschi se presenti in chiavi specializzate
        pec: settingsMap.sdi?.pec || settingsMap.company?.pec || null,
        regime_fiscale: settingsMap.sdi?.regime_fiscale || settingsMap.company?.regime_fiscale || 'RF01',
        codice_destinatario: settingsMap.sdi?.codice_destinatario || settingsMap.company?.codice_destinatario || null,
        iban: settingsMap.billing?.iban || settingsMap.invoices?.defaultFields?.iban || settingsMap.company?.iban || null,
      },
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
      last_access_at: lastAccessAt,
      // Utilizzo del gestionale (conteggi)
      usage: {
        transports: transportsCount,
        transports_30d: transports30dRaw ?? 0,
        vehicles: vehiclesCount,
        clients: clientsCount,
        drivers: driversCount,
        invoices: invoicesCount,
      },
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
