// Richiedi correzione (F5) — l'admin, dalla Revisione, rimanda la pratica al cliente
// con una MOTIVAZIONE. Imposta il lead a 'trattativa', annota il motivo, e invia al
// cliente l'email con il motivo + link per riprendere e reinviare.
// Auth staff: middleware su /api/staff/admin/* + getStaffFromRequest.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { sendCustomerEmail } from '@/lib/customer-email';
import { createAuditLog } from '@/lib/staff-audit';

export const runtime = 'nodejs';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu').replace(/\/$/, '');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  let body: { reason?: string };
  try { body = await request.json(); } catch { body = {}; }
  const reason = String(body.reason || '').trim();
  if (!reason) {
    return NextResponse.json({ success: false, error: 'Motivazione richiesta' }, { status: 400 });
  }

  const leadId = params.id;
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, name, email, company, notes, status')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) {
    return NextResponse.json({ success: false, error: 'Lead non trovato' }, { status: 404 });
  }

  // Stato → trattativa + nota con il motivo (per lo storico/onboarding).
  const notes = `${lead.notes ? lead.notes + '\n' : ''}[Revisione] Richiesta correzione: ${reason}`;
  await supabaseAdmin.from('leads').update({ status: 'trattativa', notes }).eq('id', leadId);

  // Trova il preventivo pagato → public_uuid per il link "riprendi pratica".
  const { data: quote } = await supabaseAdmin
    .from('lead_quotes')
    .select('public_uuid')
    .eq('lead_id', leadId)
    .in('status', ['paid', 'pending_activation'])
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const link = quote?.public_uuid ? `${SITE_URL}/pratica/${quote.public_uuid}` : `${SITE_URL}`;

  // Email al cliente con il motivo + link (best-effort).
  if (lead.email) {
    await sendCustomerEmail(
      lead.email,
      'Serve una correzione alla tua pratica — RescueManager',
      `Ciao {{nome}},\n\n` +
      `Abbiamo esaminato la tua pratica e serve una piccola correzione prima di completare l'attivazione.\n\n` +
      `Motivo: ${reason}\n\n` +
      `Riprendi la pratica, aggiorna i dati e reinviala da qui:\n${link}\n\n` +
      `Grazie,\nIl team RescueManager`,
      { nome: lead.name, azienda: lead.company },
    );
  }

  try {
    await createAuditLog(staff.sub, staff.full_name, staff.role, 'lead.status_change', 'lead', leadId, lead.company || lead.name || leadId, { action: 'request_correction', reason }, request, true);
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true, emailed: !!lead.email });
}
