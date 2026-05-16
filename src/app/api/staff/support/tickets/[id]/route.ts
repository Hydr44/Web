/**
 * Sistema Supporto — API staff (dettaglio + aggiornamento)
 * GET   /api/staff/support/tickets/[id]  → ticket + messaggi
 * PATCH /api/staff/support/tickets/[id]  → stato / priorità / assegnazione
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { notifyCustomerStatus } from '@/lib/support-email';

export const runtime = 'nodejs';

const STATUSES = ['open', 'pending', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });

  const { data: ticket, error: tErr } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (tErr) return NextResponse.json({ success: false, error: tErr.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ success: false, error: 'Ticket non trovato' }, { status: 404 });

  const { data: messages } = await supabaseAdmin
    .from('ticket_messages')
    .select('id, sender_type, sender_name, body, attachments, created_at')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true });

  // Lo staff ha aperto il ticket → azzera "non letto" lato staff
  await supabaseAdmin
    .from('support_tickets')
    .update({ staff_unread: false })
    .eq('id', params.id);

  return NextResponse.json({ success: true, ticket, messages: messages || [] });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });

  let body: { status?: string; priority?: string; assigned_to?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body non valido' }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status && STATUSES.includes(body.status)) {
    patch.status = body.status;
    if (body.status === 'resolved') patch.resolved_at = new Date().toISOString();
    if (body.status === 'closed') patch.closed_at = new Date().toISOString();
  }
  if (body.priority && PRIORITIES.includes(body.priority)) patch.priority = body.priority;
  if (body.assigned_to !== undefined) patch.assigned_to = body.assigned_to;

  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .update(patch)
    .eq('id', params.id)
    .select('subject, customer_email, status')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (patch.status === 'resolved' || patch.status === 'closed') {
    notifyCustomerStatus({
      subject: ticket.subject,
      customer_email: ticket.customer_email,
      status: ticket.status,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
