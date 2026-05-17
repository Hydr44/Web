/**
 * Sistema Supporto — azioni bulk staff
 * POST /api/staff/support/tickets/bulk
 * body: { ids: string[], action: 'resolve'|'close'|'reopen'|'assign', assigned_to?: string|null }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { notifyCustomerStatus } from '@/lib/support-email';

export const runtime = 'nodejs';

type Action = 'resolve' | 'close' | 'reopen' | 'assign';

export async function POST(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });

  let body: { ids?: unknown; action?: string; assigned_to?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body non valido' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : [];
  const action = body.action as Action;
  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: 'Nessun ticket selezionato' }, { status: 400 });
  }
  if (!['resolve', 'close', 'reopen', 'assign'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Azione non valida' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now, staff_unread: false };

  if (action === 'resolve') { patch.status = 'resolved'; patch.resolved_at = now; }
  else if (action === 'close') { patch.status = 'closed'; patch.closed_at = now; }
  else if (action === 'reopen') { patch.status = 'open'; patch.resolved_at = null; patch.closed_at = null; }
  else if (action === 'assign') { patch.assigned_to = body.assigned_to ?? null; }

  const { data: updated, error } = await supabaseAdmin
    .from('support_tickets')
    .update(patch)
    .in('id', ids)
    .select('id, subject, customer_email, status');

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Email al cliente per resolve/close (best effort, non blocca)
  if (action === 'resolve' || action === 'close') {
    for (const t of updated || []) {
      notifyCustomerStatus({
        id: t.id,
        subject: t.subject,
        customer_email: t.customer_email,
        status: t.status,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, count: updated?.length ?? 0 });
}
