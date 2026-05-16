/**
 * Sistema Supporto — API cliente
 * GET  /api/support/tickets         → lista ticket dell'utente
 * POST /api/support/tickets         → crea nuovo ticket (+ primo messaggio)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { notifyStaffNewTicket } from '@/lib/support-email';

export const runtime = 'nodejs';

const CATEGORIES = ['domanda', 'bug', 'funzionalita', 'fatturazione', 'altro'];

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .select('id, subject, category, priority, status, last_message_at, created_at')
    .order('last_message_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  let body: { subject?: string; category?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const subject = (body.subject || '').trim();
  const message = (body.message || '').trim();
  const category = CATEGORIES.includes(body.category || '') ? body.category! : 'domanda';

  if (subject.length < 3 || message.length < 5) {
    return NextResponse.json({ error: 'Oggetto e messaggio obbligatori' }, { status: 400 });
  }
  if (subject.length > 200 || message.length > 5000) {
    return NextResponse.json({ error: 'Testo troppo lungo' }, { status: 400 });
  }

  // org corrente (best effort)
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_org, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const customerName = profile?.full_name || user.email || 'Cliente';

  const { data: ticket, error: tErr } = await supabase
    .from('support_tickets')
    .insert({
      org_id: profile?.current_org ?? null,
      created_by: user.id,
      customer_email: user.email,
      customer_name: customerName,
      subject,
      category,
      status: 'open',
    })
    .select('id, subject, category')
    .single();

  if (tErr || !ticket) {
    return NextResponse.json({ error: tErr?.message || 'Errore creazione ticket' }, { status: 500 });
  }

  const { error: mErr } = await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'customer',
    sender_id: user.id,
    sender_name: customerName,
    body: message,
  });
  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }

  // Notifica staff (non blocca la risposta)
  notifyStaffNewTicket({
    id: ticket.id,
    subject,
    category,
    customer_email: user.email!,
    customer_name: customerName,
    body: message,
  }).catch(() => {});

  return NextResponse.json({ ok: true, ticket_id: ticket.id }, { status: 201 });
}
