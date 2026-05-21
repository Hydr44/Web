import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * POST /api/auth/mfa/backup-codes/revoke
 * Revoca tutti i codici di backup dell'utente in sessione. Tipicamente
 * chiamato quando si disabilita il 2FA (unenroll) per non lasciare codici
 * orfani che funzionerebbero senza factor associato.
 */
export async function POST(request: Request) {
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
    const { error } = await supabaseAdmin
      .from('user_mfa_backup_codes')
      .delete()
      .eq('user_id', user.id);
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
    return NextResponse.json(
      { ok: true },
      { headers: corsHeaders(origin) }
    );
  } catch (e: unknown) {
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
