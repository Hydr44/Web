/**
 * GET /api/staff/admin/clients
 * Lista unificata: org + subscription + member_count + owner + lead origin
 *
 * Sostituisce le 3 viste separate (organizations + subscriptions + clients legacy).
 * Source of truth: tabella `orgs` con left join su org_subscriptions, org_members count,
 *                  profiles per owner, leads per provenienza.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    // 1. Tutte le org
    const { data: orgs, error: orgsErr } = await supabaseAdmin
      .from('orgs')
      .select(`
        id, name, is_demo, demo_expires_at, web_access_enabled, desktop_access_enabled,
        desktop_modules, converted_from_lead_id, created_by, created_at, updated_at
      `)
      .order('created_at', { ascending: false });

    if (orgsErr) {
      return NextResponse.json({ success: false, error: orgsErr.message }, { status: 500, headers: corsHeaders(origin) });
    }

    const orgIds = (orgs || []).map(o => o.id);
    if (orgIds.length === 0) {
      return NextResponse.json({ success: true, clients: [] }, { headers: corsHeaders(origin) });
    }

    // 2. Subscriptions
    const { data: subs } = await supabaseAdmin
      .from('org_subscriptions')
      .select('*')
      .in('org_id', orgIds);
    const subsMap = new Map((subs || []).map(s => [s.org_id, s]));

    // 3. Member count + owner per org
    const { data: members } = await supabaseAdmin
      .from('org_members')
      .select('org_id, user_id, role')
      .in('org_id', orgIds);

    const memberCountMap = new Map<string, number>();
    const ownerMap = new Map<string, string>(); // org_id → user_id (owner)
    for (const m of members || []) {
      memberCountMap.set(m.org_id, (memberCountMap.get(m.org_id) || 0) + 1);
      if (m.role === 'owner' && !ownerMap.has(m.org_id)) {
        ownerMap.set(m.org_id, m.user_id);
      }
    }

    // 4. Owner profiles
    const ownerUserIds = [...new Set(Array.from(ownerMap.values()))];
    const profilesMap = new Map<string, any>();
    if (ownerUserIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', ownerUserIds);
      for (const p of profiles || []) profilesMap.set(p.id, p);
    }

    // 5. Company info da org_settings (JSONB)
    const { data: settings } = await supabaseAdmin
      .from('org_settings')
      .select('org_id, value')
      .in('org_id', orgIds)
      .eq('key', 'company');
    const companyMap = new Map<string, any>();
    for (const s of settings || []) companyMap.set(s.org_id, s.value || {});

    // 6. Lead origin (se converted)
    const leadIds = (orgs || []).map(o => o.converted_from_lead_id).filter(Boolean) as string[];
    const leadsMap = new Map<string, any>();
    if (leadIds.length) {
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('id, name, company, source, first_contact_at, converted_at')
        .in('id', leadIds);
      for (const l of leads || []) leadsMap.set(l.id, l);
    }

    // 7. Compose
    const clients = (orgs || []).map(org => {
      const sub = subsMap.get(org.id);
      const ownerId = ownerMap.get(org.id);
      const owner = ownerId ? profilesMap.get(ownerId) : null;
      const company = companyMap.get(org.id) || {};
      const lead = org.converted_from_lead_id ? leadsMap.get(org.converted_from_lead_id) : null;

      let status: string = 'inactive';
      if (org.is_demo) status = 'demo';
      else if (sub?.status === 'active') status = 'active';
      else if (sub?.status === 'trialing' || sub?.status === 'trial') status = 'trial';
      else if (sub?.status === 'past_due') status = 'past_due';
      else if (sub?.status === 'canceled' || sub?.status === 'cancelled') status = 'canceled';
      else if (sub?.status) status = sub.status;

      return {
        // Identity
        id: org.id,
        name: company.company_name || org.name,
        company_name: company.company_name || org.name,
        // Anagrafica (da org_settings.company)
        vat_number: company.vat || company.piva || null,
        tax_code: company.tax_code || null,
        pec: company.pec || null,
        forma_giuridica: company.forma_giuridica || null,
        codice_ateco: company.codice_ateco || null,
        address: company.address || null,  // { street, city, province, zip, country }
        phone: company.phone || null,
        email: company.email || owner?.email || null,
        // Owner
        owner_id: ownerId || null,
        owner_email: owner?.email || null,
        owner_name: owner?.full_name || null,
        // Subscription
        subscription: sub || null,
        plan: sub?.plan || null,
        billing_type: sub?.billing_type || null,
        current_period_end: sub?.current_period_end || null,
        trial_end: sub?.trial_end || null,
        // Status unificato
        status,
        // Membri
        member_count: memberCountMap.get(org.id) || 0,
        // Moduli
        desktop_modules: org.desktop_modules || [],
        web_access_enabled: org.web_access_enabled,
        desktop_access_enabled: org.desktop_access_enabled,
        // Demo
        is_demo: org.is_demo,
        demo_expires_at: org.demo_expires_at,
        // Lead origin
        lead_id: org.converted_from_lead_id,
        lead_origin: lead ? {
          id: lead.id,
          source: lead.source,
          first_contact_at: lead.first_contact_at,
          converted_at: lead.converted_at,
        } : null,
        // Audit
        created_at: org.created_at,
        updated_at: org.updated_at,
      };
    });

    return NextResponse.json({ success: true, clients }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    console.error('[admin clients] error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
