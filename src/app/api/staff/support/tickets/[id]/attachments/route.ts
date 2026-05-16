/**
 * Sistema Supporto — upload allegato (staff)
 * POST /api/staff/support/tickets/[id]/attachments  (multipart, campo "file")
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { uploadTicketFile } from '@/lib/support-attachments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });

  const { data: ticket } = await supabaseAdmin
    .from('support_tickets')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ success: false, error: 'Ticket non trovato' }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Form non valido' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'File mancante' }, { status: 400 });
  }

  try {
    const att = await uploadTicketFile(params.id, file);
    return NextResponse.json({ success: true, attachment: att });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload fallito';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
