// Invia al cliente il link "VERIFICA DATI" (pratica/visura) per un preventivo.
// Serve quando il pagamento è segnato a mano (carta/bonifico) in admin: il
// cliente non è passato dal flusso online, quindi non ha ricevuto il link per
// caricare la visura e confermare i dati azienda. Questo endpoint glielo manda.
// NON cambia lo stato del lead (a differenza di request-correction).
// Auth staff: middleware su /api/staff/admin/* + getStaffFromRequest.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { sendCustomerEmail } from '@/lib/customer-email';
import { createAuditLog } from '@/lib/staff-audit';

export const runtime = 'nodejs';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu').replace(/\/$/, '');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } },
) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }
  if (!requireStaffRole(staff, 'admin', 'manager', 'sales')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403 });
  }

  const leadId = params.id;
  const quoteId = params.qid;

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, name, email, company, demo_org_id')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) {
    return NextResponse.json({ success: false, error: 'Lead non trovato' }, { status: 404 });
  }
  if (!lead.email) {
    return NextResponse.json({ success: false, error: 'Lead senza email' }, { status: 400 });
  }

  const { data: quote } = await supabaseAdmin
    .from('lead_quotes')
    .select('public_uuid')
    .eq('id', quoteId)
    .eq('lead_id', leadId)
    .maybeSingle();
  if (!quote?.public_uuid) {
    return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 });
  }

  const link = `${SITE_URL}/pratica/${quote.public_uuid}`;

  // Gate: il cliente ha pagato ma deve ancora fare la verifica → blocca l'app
  // (overlay) finché non viene attivato post-approvazione. Marca la org demo.
  if (lead.demo_org_id) {
    await supabaseAdmin.from('orgs').update({ verification_pending: true }).eq('id', lead.demo_org_id);
  }

  await sendCustomerEmail(
    lead.email,
    'Completa la verifica dati per attivare RescueManager',
    `Ciao {{nome}},\n\n` +
    `Abbiamo registrato il tuo pagamento. Per completare l'attivazione carica la visura e conferma i dati della tua azienda da qui:\n${link}\n\n` +
    `Riceverai l'esito della verifica entro 24 ore. Fino a quel momento l'app resta in attesa di attivazione.\n\n` +
    `Grazie,\nIl team RescueManager`,
    { nome: lead.name, azienda: lead.company },
  );

  try {
    await createAuditLog(staff.sub, staff.full_name, staff.role, 'lead.verifica_link_sent', 'lead', leadId, lead.company || lead.name || leadId, { quote_id: quoteId }, request, true);
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true, emailed: true, link });
}
