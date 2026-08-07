/**
 * Sistema Supporto — upload allegato (cliente)
 * POST /api/support/tickets/[id]/attachments  (multipart/form-data, campo "file")
 * Ritorna i metadati { name, key, size, type } da includere poi nel messaggio.
 *
 * Auth: cookie (web) OPPURE Authorization: Bearer (app desktop/mobile).
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/api-auth';
import { corsHeaders } from '@/lib/cors';
import { uploadTicketFile } from '@/lib/support-attachments';

export const runtime = 'nodejs';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const cors = corsHeaders(request.headers.get('origin'));

  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401, headers: cors });
  }

  // Verifica proprietà del ticket (via service role: nel percorso Bearer non c'è RLS)
  const { data: ticket } = await supabaseAdmin
    .from('support_tickets')
    .select('id, created_by')
    .eq('id', params.id)
    .maybeSingle();
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404, headers: cors });
  }
  if (ticket.created_by && ticket.created_by !== user.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403, headers: cors });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Form non valido' }, { status: 400, headers: cors });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File mancante' }, { status: 400, headers: cors });
  }

  try {
    const att = await uploadTicketFile(params.id, file);
    return NextResponse.json({ ok: true, attachment: att }, { headers: cors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload fallito';
    return NextResponse.json({ error: msg }, { status: 400, headers: cors });
  }
}
