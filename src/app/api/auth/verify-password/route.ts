import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/lib/cors';

/**
 * POST /api/auth/verify-password
 * Verifica che la password fornita sia quella attuale dell'utente in sessione.
 * Necessario prima di operazioni sensibili (cambio password, disabilitazione 2FA).
 *
 * Usa un client Supabase usa-e-getta (no persistSession) per non sporcare
 * la sessione corrente del browser.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body as { password?: string };

    if (!password || typeof password !== 'string' || password.length < 1) {
      return NextResponse.json(
        { ok: false, error: 'Password richiesta' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const supabase = await supabaseServer();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user?.email) {
      return NextResponse.json(
        { ok: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // Tentativo di sign-in con un client temporaneo. Se va a buon fine, la
    // password è corretta. Niente persistenza: non scrive cookie/localStorage
    // e non tocca la sessione attiva del browser.
    const checker = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error: signErr } = await checker.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signErr) {
      return NextResponse.json(
        { ok: false, error: 'Password attuale non corretta' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // Best-effort: revoca la sessione creata dal checker (anche se non persistita).
    try { await checker.auth.signOut(); } catch { /* ignore */ }

    return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
  } catch (e: unknown) {
    console.error('[verify-password] error:', e);
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
