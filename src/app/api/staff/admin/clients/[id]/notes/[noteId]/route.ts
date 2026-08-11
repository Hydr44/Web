/**
 * PATCH  /api/staff/admin/clients/:id/notes/:noteId  → aggiorna pinned di una nota
 * DELETE /api/staff/admin/clients/:id/notes/:noteId  → elimina una nota
 *
 * Ogni operazione filtra anche per org_id (params.id) oltre all'id della nota,
 * così una nota di un'altra org non è raggiungibile per errore. Tabella
 * public.client_notes, solo service_role. Auth staff garantita dal middleware.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return handleCors(request) as NextResponse;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    let payload: { pinned?: unknown } = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    if (typeof payload.pinned !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Il campo pinned deve essere booleano' },
        { status: 400, headers }
      );
    }

    const { error } = await supabaseAdmin
      .from('client_notes')
      .update({ pinned: payload.pinned })
      .eq('id', params.noteId)
      .eq('org_id', params.id);

    if (error) {
      console.warn('[admin client notes PATCH]', error.message);
      return NextResponse.json(
        { success: false, error: 'Impossibile aggiornare la nota' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ success: true }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { error } = await supabaseAdmin
      .from('client_notes')
      .delete()
      .eq('id', params.noteId)
      .eq('org_id', params.id);

    if (error) {
      console.warn('[admin client notes DELETE]', error.message);
      return NextResponse.json(
        { success: false, error: 'Impossibile eliminare la nota' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ success: true }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers }
    );
  }
}
