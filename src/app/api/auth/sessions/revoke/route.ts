import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { corsHeaders } from '@/lib/cors';

/**
 * POST /api/auth/sessions/revoke
 * Body: { session_id?: string, all_other?: boolean }
 *
 * Usa le funzioni SECURITY DEFINER `public.revoke_my_session(uuid)` e
 * `public.revoke_my_other_sessions()` (vedi migration
 * 20260521_user_sessions_rpc.sql). Le funzioni filtrano per `auth.uid()`
 * quindi un utente non può revocare sessioni altrui.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));
    const { session_id, all_other } = body as { session_id?: string; all_other?: boolean };

    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    if (all_other) {
      const { data, error } = await supabase.rpc('revoke_my_other_sessions');
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500, headers: corsHeaders(origin) }
        );
      }
      return NextResponse.json(
        { ok: true, revoked_count: data ?? 0 },
        { headers: corsHeaders(origin) }
      );
    }

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'session_id richiesto' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { data, error } = await supabase.rpc('revoke_my_session', {
      p_session_id: session_id,
    });
    if (error) {
      // codice 42501 = forbidden (sessione di altri utenti)
      const status = error.code === '42501' ? 403 : 500;
      return NextResponse.json(
        { ok: false, error: error.message },
        { status, headers: corsHeaders(origin) }
      );
    }
    if (data === false) {
      return NextResponse.json(
        { ok: false, error: 'Sessione non trovata' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }
    return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
  } catch (e: unknown) {
    console.error('[sessions/revoke] error:', e);
    const msg = e instanceof Error ? e.message : 'Errore interno';
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
