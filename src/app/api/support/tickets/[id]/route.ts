/**
 * Sistema Supporto — API cliente (dettaglio)
 * GET /api/support/tickets/[id]  → ticket + thread messaggi
 */
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { data: ticket, error: tErr } = await supabase
    .from('support_tickets')
    .select('id, subject, category, priority, status, created_at, last_message_at, resolved_at, closed_at')
    .eq('id', params.id)
    .maybeSingle();

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });

  const { data: messages, error: mErr } = await supabase
    .from('ticket_messages')
    .select('id, sender_type, sender_name, body, attachments, created_at')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true });

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  // Il cliente ha visto il ticket → azzera "non letto" lato cliente
  await supabase
    .from('support_tickets')
    .update({ customer_unread: false })
    .eq('id', params.id);

  return NextResponse.json({ ticket, messages: messages || [] });
}
