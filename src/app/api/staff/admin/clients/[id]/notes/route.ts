/**
 * GET  /api/staff/admin/clients/:id/notes  → lista note interne dell'org
 * POST /api/staff/admin/clients/:id/notes  → crea una nota interna
 *
 * Thread di note interne staff su un cliente (org). Tabella public.client_notes,
 * accessibile solo via service_role. L'auth staff è già garantita dal
 * middleware /api/staff/*, quindi non va rifatta nel handler.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

export const runtime = 'nodejs';

const KIND_VALIDI = ['commerciale', 'tecnico', 'pagamenti', 'generale'];

export async function OPTIONS(request: Request) {
  return handleCors(request) as NextResponse;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { data, error } = await supabaseAdmin
      .from('client_notes')
      .select('*')
      .eq('org_id', params.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[admin client notes GET]', error.message);
      return NextResponse.json(
        { success: false, error: 'Impossibile caricare le note' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ success: true, notes: data ?? [] }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers }
    );
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    let payload: {
      kind?: unknown;
      body?: unknown;
      author_email?: unknown;
      author_name?: unknown;
    } = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const body = typeof payload.body === 'string' ? payload.body.trim() : '';
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Il testo della nota è obbligatorio' },
        { status: 400, headers }
      );
    }

    const kindRaw = typeof payload.kind === 'string' ? payload.kind : '';
    const kind = KIND_VALIDI.includes(kindRaw) ? kindRaw : 'generale';
    const authorEmail = typeof payload.author_email === 'string' ? payload.author_email.trim() : null;
    const authorName = typeof payload.author_name === 'string' ? payload.author_name.trim() : null;

    const { data, error } = await supabaseAdmin
      .from('client_notes')
      .insert({
        org_id: params.id,
        author_email: authorEmail,
        author_name: authorName,
        kind,
        body,
      })
      .select('*')
      .single();

    if (error) {
      console.warn('[admin client notes POST]', error.message);
      return NextResponse.json(
        { success: false, error: 'Impossibile salvare la nota' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ success: true, note: data }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers }
    );
  }
}
