/**
 * GET /api/staff/admin/appointments?from=ISO&to=ISO
 * Tutti gli appuntamenti pianificati (di tutti i lead) in un intervallo, per la
 * pagina Calendario globale dell'admin-panel. Legge lead_appointments direttamente
 * via service-role (stessa Supabase del proxy VPS lead-api), con join sul lead.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let q = supabaseAdmin
      .from('lead_appointments')
      .select('id, lead_id, title, appointment_type, meeting_mode, status, scheduled_at, scheduled_until, duration_minutes, leads(name, company)')
      .not('scheduled_at', 'is', null)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true });

    if (from) q = q.gte('scheduled_at', from);
    if (to) q = q.lte('scheduled_at', to);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    const appointments = (data || []).map((a: any) => ({
      id: a.id,
      lead_id: a.lead_id,
      lead_name: a.leads?.name || null,
      lead_company: a.leads?.company || null,
      title: a.title,
      appointment_type: a.appointment_type,
      meeting_mode: a.meeting_mode,
      status: a.status,
      scheduled_at: a.scheduled_at,
      scheduled_until: a.scheduled_until,
      duration_minutes: a.duration_minutes,
    }));

    return NextResponse.json({ success: true, appointments }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
