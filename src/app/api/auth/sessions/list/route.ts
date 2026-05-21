import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * GET /api/auth/sessions/list
 * Ritorna le sessioni attive dell'utente in sessione (lette da auth.sessions
 * via service role). La sessione "corrente" è marcata via match con il
 * session_id dal cookie attivo.
 *
 * Nota: auth.sessions è gestito da Supabase. Schema (sintetico):
 *   id uuid, user_id uuid, factor_id, aal, not_after, created_at, updated_at,
 *   ip inet (nullable), user_agent text (nullable)
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

    // L'id della sessione corrente, se esposto dal token.
    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionId = (session as unknown as { id?: string } | null)?.id ?? null;

    // Query auth.sessions via service role.
    const { data, error } = await supabaseAdmin
      .schema('auth')
      .from('sessions')
      .select('id, created_at, updated_at, not_after, ip, user_agent, aal, factor_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const sessions = (data || []).map((s) => ({
      id: s.id as string,
      created_at: s.created_at as string,
      updated_at: s.updated_at as string,
      not_after: s.not_after as string | null,
      ip: s.ip as string | null,
      user_agent: s.user_agent as string | null,
      aal: s.aal as string | null,
      factor_id: s.factor_id as string | null,
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
