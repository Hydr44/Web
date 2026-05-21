import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * POST /api/auth/sessions/revoke
 * Body: { session_id?: string, all_other?: boolean }
 *
 * Revoca una specifica sessione dell'utente, oppure tutte tranne la corrente
 * se `all_other:true`. Implementato via `supabase.auth.admin.signOut(jwt)`
 * non è disponibile per session_id direttamente, quindi eliminiamo le righe
 * in `auth.sessions` (Supabase invalida i token quando la sessione è rimossa).
 *
 * Solo le sessioni dell'utente in sessione possono essere revocate.
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

    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionId = (session as unknown as { id?: string } | null)?.id ?? null;

    if (all_other) {
      // Elimina tutte le sessioni dell'utente eccetto quella corrente.
      let q = supabaseAdmin.schema('auth').from('sessions').delete().eq('user_id', user.id);
      if (currentSessionId) q = q.neq('id', currentSessionId);
      const { error } = await q;
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500, headers: corsHeaders(origin) }
        );
      }
      return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
    }

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'session_id richiesto' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Verifica che la sessione appartenga all'utente prima di eliminarla.
    const { data: own, error: chkErr } = await supabaseAdmin
      .schema('auth')
      .from('sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (chkErr) {
      return NextResponse.json(
        { ok: false, error: chkErr.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
    if (!own) {
      return NextResponse.json(
        { ok: false, error: 'Sessione non trovata' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const { error: delErr } = await supabaseAdmin
      .schema('auth')
      .from('sessions')
      .delete()
      .eq('id', session_id);
    if (delErr) {
      return NextResponse.json(
        { ok: false, error: delErr.message },
        { status: 500, headers: corsHeaders(origin) }
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
