/**
 * Sistema Supporto — API cliente (risposta)
 * POST /api/support/tickets/[id]/reply  → il cliente risponde sul proprio ticket
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { notifyStaffCustomerReply } from '@/lib/support-email';
import { normalizeAttachments } from '@/lib/support-attachments';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  let body: { message?: string; attachments?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }
  const message = (body.message || '').trim();
  const attachments = normalizeAttachments(body.attachments);
  if ((message.length < 2 && attachments.length === 0) || message.length > 5000) {
    return NextResponse.json({ error: 'Messaggio non valido' }, { status: 400 });
  }

  // RLS garantisce che l'utente veda solo i propri ticket
  const { data: ticket, error: tErr } = await supabase
    .from('support_tickets')
    .select('id, subject, customer_email, status')
    .eq('id', params.id)
    .maybeSingle();

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const senderName = profile?.full_name || user.email || 'Cliente';

  const { error: mErr } = await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'customer',
    sender_id: user.id,
    sender_name: senderName,
    body: message || '(allegato)',
    attachments,
  });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  // Il cliente ha risposto: lato staff è da leggere, lato cliente già letto.
  // Una risposta del cliente riapre un ticket risolto/chiuso.
  const upd: Record<string, unknown> = { staff_unread: true, customer_unread: false };
  if (['resolved', 'closed'].includes(ticket.status)) {
    upd.status = 'open';
    upd.resolved_at = null;
    upd.closed_at = null;
  }
  await supabase.from('support_tickets').update(upd).eq('id', ticket.id);

  notifyStaffCustomerReply({
    id: ticket.id,
    subject: ticket.subject,
    customer_email: ticket.customer_email,
    body: message,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
