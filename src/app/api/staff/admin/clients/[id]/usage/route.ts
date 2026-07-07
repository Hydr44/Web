/**
 * GET /api/staff/admin/clients/:id/usage
 * Statistiche di UTILIZZO del gestionale per un cliente (org). SOLO LETTURA:
 * esclusivamente COUNT/SELECT aggregati, nessuna scrittura → zero rischio sui
 * dati del cliente. Difensivo: se una tabella non esiste ritorna 0 (niente 500).
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

const MONTHS = 12;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });

  const orgId = params.id;
  try {
    // Identità org
    const { data: org, error: orgErr } = await supabaseAdmin
      .from('orgs').select('id, name, created_at, is_demo').eq('id', orgId).single();
    if (orgErr || !org) return NextResponse.json({ success: false, error: 'Cliente non trovato' }, { status: 404, headers });

    const { data: settings } = await supabaseAdmin.from('org_settings').select('key, value').eq('org_id', orgId);
    const settingsMap: Record<string, any> = {};
    for (const s of settings || []) settingsMap[s.key] = s.value;
    const { data: sub } = await supabaseAdmin.from('org_subscriptions').select('plan, status').eq('org_id', orgId).maybeSingle();

    // Count difensivo su una tabella org-scoped
    const countOf = async (table: string, extra?: (q: any) => any) => {
      try {
        let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true }).eq('org_id', orgId);
        if (extra) q = extra(q);
        const { count, error } = await q;
        return error ? 0 : (count ?? 0);
      } catch { return 0; }
    };

    const thirty = new Date(Date.now() - 30 * 86400000).toISOString();

    const [
      transports, transports30, vehicles, clients, drivers, invoices,
      quotes, operators, members, ricambi, rentriSped, demolizioni,
    ] = await Promise.all([
      countOf('transports'),
      countOf('transports', (q) => q.gt('created_at', thirty)),
      countOf('vehicles'),
      countOf('clients'),
      countOf('staff_drivers'),
      countOf('invoices'),
      countOf('quotes'),
      countOf('operators'),
      countOf('org_members'),
      countOf('ricambi'),
      countOf('rentri_spedizioni'),
      countOf('demolizioni'),
    ]);

    // Serie mensile (ultimi 12 mesi) dei trasporti — 12 count con range date.
    // Bounded e read-only. Le etichette mese le calcola il client dai timestamp.
    const now = new Date();
    const monthBounds: { label: string; from: string; to: string }[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
      monthBounds.push({ label: from.toISOString().slice(0, 7), from: from.toISOString(), to: to.toISOString() });
    }
    const monthly_transports = await Promise.all(
      monthBounds.map(async (m) => ({
        month: m.label,
        count: await countOf('transports', (q) => q.gte('created_at', m.from).lt('created_at', m.to)),
      })),
    );

    // Attività per membro (pochi) — ultimo accesso reale da auth.users
    const { data: orgMembers } = await supabaseAdmin
      .from('org_members').select('user_id, role, created_at').eq('org_id', orgId)
      .order('created_at', { ascending: true });
    const memberIds = (orgMembers || []).map((m) => m.user_id);
    const profileMap = new Map<string, any>();
    if (memberIds.length) {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email, full_name').in('id', memberIds);
      for (const p of profiles || []) profileMap.set(p.id, p);
    }
    const memberActivity = await Promise.all((orgMembers || []).map(async (m) => {
      let lastSignIn: string | null = null;
      try { const { data } = await supabaseAdmin.auth.admin.getUserById(m.user_id); lastSignIn = data?.user?.last_sign_in_at ?? null; } catch { /* ignore */ }
      const p = profileMap.get(m.user_id);
      return { user_id: m.user_id, email: p?.email || null, full_name: p?.full_name || null, role: m.role, joined_at: m.created_at, last_sign_in_at: lastSignIn };
    }));
    const lastAccess = memberActivity.map((m) => m.last_sign_in_at).filter(Boolean).sort().pop() || null;

    // Moduli attivi
    const { data: mods } = await supabaseAdmin.from('org_modules').select('module, status').eq('org_id', orgId);
    const modulesEnabled = (mods || []).filter((m: any) => m.status === 'active' || m.status === 'trial').map((m: any) => m.module);

    return NextResponse.json({
      success: true,
      usage: {
        identity: {
          id: org.id,
          name: settingsMap.company?.company_name || org.name,
          created_at: org.created_at,
          is_demo: org.is_demo,
          plan: sub?.plan || null,
          status: sub?.status || null,
        },
        counts: { transports, transports_30d: transports30, vehicles, clients, drivers, invoices, quotes, operators, members, ricambi, rentri: rentriSped, demolizioni },
        monthly_transports,
        members: memberActivity,
        modules_enabled: modulesEnabled,
        last_access_at: lastAccess,
      },
    }, { headers });
  } catch (e: any) {
    console.error('[admin client usage] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
