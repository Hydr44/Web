/**
 * Sistema Supporto — API cliente
 * GET  /api/support/tickets         → lista ticket dell'utente (web, cookie+RLS)
 * POST /api/support/tickets         → crea nuovo ticket (+ primo messaggio)
 *
 * Auth POST: cookie (web) OPPURE Authorization: Bearer (app desktop/mobile).
 * CORS abilitato per le app desktop/mobile (vedi lib/cors).
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/api-auth';
import { corsHeaders } from '@/lib/cors';
import { notifyStaffNewTicket, notifyCustomerTicketOpened } from '@/lib/support-email';
import { normalizeAttachments } from '@/lib/support-attachments';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/security';

export const runtime = 'nodejs';

const CATEGORIES = ['domanda', 'bug', 'funzionalita', 'fatturazione', 'altro', 'chat'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const MIN_SUBJECT = 3;
const MIN_MESSAGE = 10;

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .select('id, subject, category, priority, status, last_message_at, created_at, customer_unread')
    .order('last_message_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  // Rate limit: max 5 nuovi ticket per IP ogni 10 minuti (no-op su serverless)
  const rlId = getRateLimitIdentifier(request, 'ip');
  const rl = await checkRateLimit(rlId, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    const min = Math.ceil((rl.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Troppe richieste. Riprova tra ${min} minut${min === 1 ? 'o' : 'i'}.` },
      { status: 429, headers: cors }
    );
  }

  // Auth: cookie (web) o Bearer (desktop/mobile)
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401, headers: cors });
  }

  let body: {
    subject?: string; category?: string; message?: string;
    priority?: string; source?: string; attachments?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400, headers: cors });
  }

  const subject = (body.subject || '').trim();
  const message = (body.message || '').trim();
  const category = CATEGORIES.includes(body.category || '') ? body.category! : 'domanda';
  const priority = PRIORITIES.includes(body.priority || '') ? body.priority! : 'normal';
  const source = (body.source ? String(body.source) : 'web').slice(0, 32);
  const attachments = normalizeAttachments(body.attachments);

  if (subject.length < MIN_SUBJECT) {
    return NextResponse.json(
      { error: `L'oggetto deve contenere almeno ${MIN_SUBJECT} caratteri.` }, { status: 400, headers: cors });
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: "L'oggetto non può superare i 200 caratteri." }, { status: 400, headers: cors });
  }
  if (message.length < MIN_MESSAGE) {
    return NextResponse.json(
      { error: `Il messaggio deve contenere almeno ${MIN_MESSAGE} caratteri: descrivi il problema con qualche dettaglio in più.` },
      { status: 400, headers: cors });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: 'Il messaggio non può superare i 5000 caratteri.' }, { status: 400, headers: cors });
  }

  // org corrente (best effort) — via service role: funziona anche nel percorso Bearer
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('current_org, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const customerName = profile?.full_name || user.email || 'Cliente';

  const { data: ticket, error: tErr } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      org_id: profile?.current_org ?? null,
      created_by: user.id,
      customer_email: user.email,
      customer_name: customerName,
      subject,
      category,
      priority,
      status: 'open',
    })
    .select('id, subject, category')
    .single();

  if (tErr || !ticket) {
    return NextResponse.json({ error: tErr?.message || 'Errore creazione ticket' }, { status: 500, headers: cors });
  }

  // Origine (best-effort: non blocca se la colonna `source` non è ancora stata creata)
  supabaseAdmin.from('support_tickets').update({ source }).eq('id', ticket.id).then(() => {}, () => {});

  const isChat = category === 'chat';

  const { error: mErr } = await supabaseAdmin.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'customer',
    sender_id: user.id,
    sender_name: customerName,
    body: message,
    attachments,
  });
  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500, headers: cors });
  }

  // Messaggio di sistema automatico: conferma presa in carico + tempi attesi
  await supabaseAdmin.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'system',
    sender_id: null,
    sender_name: 'RescueManager',
    body: isChat
      ? 'Chat avviata. Un operatore prenderà in carico la conversazione il prima possibile (orari ufficio Lun–Ven 9:00–18:00, di norma entro 1 ora). Resta su questa pagina per la risposta in tempo reale.'
      : 'Grazie, abbiamo ricevuto la tua richiesta. Un operatore ti risponderà a breve — tempo medio di risposta entro 24 ore lavorative. Riceverai una notifica via email a ogni aggiornamento.',
  });

  // Notifiche email (non bloccano la risposta)
  notifyStaffNewTicket({
    id: ticket.id,
    isChat,
    subject,
    category,
    customer_email: user.email!,
    customer_name: customerName,
    body: message,
  }).catch(() => {});
  notifyCustomerTicketOpened({
    id: ticket.id,
    subject,
    category,
    customer_email: user.email!,
    customer_name: customerName,
    isChat,
  }).catch(() => {});

  return NextResponse.json({ ok: true, ticket_id: ticket.id }, { status: 201, headers: cors });
}
