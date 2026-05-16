/**
 * Sistema Supporto — API staff
 * GET /api/staff/support/tickets        → lista ticket (filtri: status)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status');

  let q = supabaseAdmin
    .from('support_tickets')
    .select('id, subject, category, priority, status, customer_email, customer_name, assigned_to, org_id, last_message_at, created_at, resolved_at, closed_at')
    .order('last_message_at', { ascending: false })
    .limit(300);

  if (status && status !== 'all') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Conteggi per stato (riassunto)
  const { data: allStatuses } = await supabaseAdmin
    .from('support_tickets')
    .select('status');
  const counts = (allStatuses || []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ success: true, tickets: data || [], counts });
}
