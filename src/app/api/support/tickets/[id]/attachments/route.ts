/**
 * Sistema Supporto — upload allegato (cliente)
 * POST /api/support/tickets/[id]/attachments  (multipart/form-data, campo "file")
 * Ritorna i metadati { name, key, size, type } da includere poi nel messaggio.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { uploadTicketFile } from '@/lib/support-attachments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // RLS: l'utente vede il ticket solo se è suo / della sua org
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Form non valido' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File mancante' }, { status: 400 });
  }

  try {
    const att = await uploadTicketFile(params.id, file);
    return NextResponse.json({ ok: true, attachment: att });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload fallito';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
