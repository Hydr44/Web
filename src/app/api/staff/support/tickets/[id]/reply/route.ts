/**
 * Sistema Supporto — API staff (risposta)
 * POST /api/staff/support/tickets/[id]/reply  → lo staff risponde al cliente
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { notifyCustomerStaffReply } from '@/lib/support-email';
import { normalizeAttachments } from '@/lib/support-attachments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });

  let body: { message?: string; close?: boolean; attachments?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body non valido' }, { status: 400 });
  }
  const message = (body.message || '').trim();
  const attachments = normalizeAttachments(body.attachments);
  if ((message.length < 1 && attachments.length === 0) || message.length > 5000) {
    return NextResponse.json({ success: false, error: 'Messaggio non valido' }, { status: 400 });
  }

  const { data: ticket, error: tErr } = await supabaseAdmin
    .from('support_tickets')
    .select('id, subject, customer_email')
    .eq('id', params.id)
    .maybeSingle();
  if (tErr) return NextResponse.json({ success: false, error: tErr.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ success: false, error: 'Ticket non trovato' }, { status: 404 });

  const staffName = staff.full_name || staff.email || 'Supporto';

  const { error: mErr } = await supabaseAdmin.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'staff',
    // Lo staff non è un utente auth.users: sender_id (FK auth.users) resta null,
    // l'identità è tracciata da sender_name.
    sender_id: null,
    sender_name: staffName,
    body: message || '(allegato)',
    attachments,
  });
  if (mErr) return NextResponse.json({ success: false, error: mErr.message }, { status: 500 });

  // Risposta staff: per il cliente è da leggere, per lo staff è già letto.
  // Porta il ticket in "in_progress" (o lo chiude se richiesto).
  const newStatus = body.close ? 'resolved' : 'in_progress';
  const upd: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    customer_unread: true,
    staff_unread: false,
  };
  if (body.close) upd.resolved_at = new Date().toISOString();
  await supabaseAdmin.from('support_tickets').update(upd).eq('id', ticket.id);

  notifyCustomerStaffReply({
    id: ticket.id,
    subject: ticket.subject,
    customer_email: ticket.customer_email,
    body: message,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
