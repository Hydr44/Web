import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { corsHeaders } from '@/lib/cors';

/**
 * Audit "chi fa cosa" per-org (azioni utenti, da tabella audit_log popolata
 * dai trigger Postgres log_audit_trail). Staff-only; legge via service role
 * (bypassa RLS) perché lo staff può ispezionare qualsiasi org.
 *
 * Query: ?org=&table=&action=&dateRange=7d&q=&page=0&pageSize=50
 * Gate: system_settings.audit_trail (se false → disabled:true).
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  try {
    // Flag globale audit_trail
    const { data: flag } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'audit_trail')
      .maybeSingle();
    const auditEnabled = flag?.value !== false && flag?.value !== 'false';
    if (!auditEnabled) {
      return NextResponse.json(
        { success: true, disabled: true, logs: [], total: 0 },
        { headers: corsHeaders(origin) }
      );
    }

    const sp = request.nextUrl.searchParams;
    const org = sp.get('org') || undefined;
    const table = sp.get('table') || undefined;
    const action = sp.get('action') || undefined;
    const q = sp.get('q')?.trim() || undefined;
    const dateRange = sp.get('dateRange') || '7d';
    const page = Math.max(0, parseInt(sp.get('page') || '0', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(sp.get('pageSize') || '50', 10)));

    const since = new Date();
    const days = dateRange === '1d' ? 1 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 7;
    since.setDate(since.getDate() - days);

    let query = supabaseAdmin
      .from('audit_log')
      .select('id, table_name, record_id, action, user_email, org_id, created_at, old_data, new_data', { count: 'exact' })
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (org) query = query.eq('org_id', org);
    if (table) query = query.eq('table_name', table);
    if (action) query = query.eq('action', action);
    if (q) query = query.ilike('user_email', `%${q}%`);

    const { data, count, error } = await query;
    if (error) {
      console.error('org-audit query error:', error);
      return NextResponse.json({ success: false, error: 'Errore query audit' }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json(
      { success: true, logs: data || [], total: count || 0, page, pageSize },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error('org-audit error:', error);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
