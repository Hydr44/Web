import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/staff/admin/audit?dateRange=1d|7d|30d|90d
 * Legge lo storico azioni staff da `staff_audit_log` (DB reale) e mappa le
 * colonne DB (target_type/target_id, staff_id/staff_email) sui nomi attesi
 * dal frontend (resource_type/resource_id, user_id/user_email).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '7d';

    const days = dateRange === '1d' ? 1 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 7;
    const startDate = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('staff_audit_log')
      .select('id, staff_id, staff_email, action, target_type, target_id, target_label, details, ip_address, user_agent, created_at')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Audit logs query error:', error);
      return NextResponse.json({ success: false, error: 'Errore lettura audit log' }, { status: 500 });
    }

    // Mappa i nomi colonna DB → nomi attesi dal frontend (AuditLogPage).
    const logs = (data || []).map((r) => ({
      id: r.id,
      action: r.action,
      resource_type: r.target_type,
      resource_id: r.target_id,
      resource_name: r.target_label,
      user_id: r.staff_id,
      user_email: r.staff_email,
      details: r.details,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
      created_at: r.created_at,
    }));

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500 });
  }
}
