/**
 * Sistema Supporto — download allegato (cliente)
 * GET /api/support/tickets/[id]/dl?key=support/<id>/...
 * Redirect 302 a URL firmato R2 (10 min). Accesso garantito da RLS sul ticket.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { signedAttachmentUrl } from '@/lib/support-attachments';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get('key') || '';
  if (!key) return NextResponse.json({ error: 'key mancante' }, { status: 400 });

  // RLS: ticket visibile solo al proprietario / org
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });

  const url = await signedAttachmentUrl(params.id, key);
  if (!url) return NextResponse.json({ error: 'Allegato non valido' }, { status: 400 });
  return NextResponse.redirect(url, 302);
}
