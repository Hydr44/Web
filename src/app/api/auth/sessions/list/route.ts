import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { corsHeaders } from '@/lib/cors';

/**
 * GET /api/auth/sessions/list
 *
 * Lista le sessioni attive dell'utente in sessione.
 *
 * Implementazione: chiama la funzione `public.list_my_sessions()` SECURITY
 * DEFINER (vedi migration 20260521_user_sessions_rpc.sql). Il REST di
 * Supabase non espone lo schema `auth`, quindi non si può leggere
 * `auth.sessions` direttamente — la funzione fa da proxy filtrando per
 * `auth.uid()`.
 *
 * La sessione "corrente" è identificata via match con il session_id
 * presente nel token (best-effort).
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // Best-effort: l'id della sessione corrente dal token (per marcare is_current).
    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionId = (session as unknown as { id?: string } | null)?.id ?? null;

    const { data, error } = await supabase.rpc('list_my_sessions');
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const sessions = (data || []).map((s: {
      id: string; created_at: string; updated_at: string;
      not_after: string | null; ip: string | null; user_agent: string | null;
      aal: string | null; factor_id: string | null;
    }) => ({
      id: s.id,
      created_at: s.created_at,
      updated_at: s.updated_at,
      not_after: s.not_after,
      ip: s.ip,
      user_agent: s.user_agent,
      aal: s.aal,
      factor_id: s.factor_id,
      is_current: !!currentSessionId && s.id === currentSessionId,
    }));

    return NextResponse.json(
      { ok: true, sessions, current_session_id: currentSessionId },
      { headers: corsHeaders(origin) }
    );
  } catch (e: unknown) {
    console.error('[sessions/list] error:', e);
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
