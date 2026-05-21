import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * GET /api/auth/mfa/backup-codes/status
 * Ritorna il numero di codici di backup ancora validi (non consumati).
 * Non restituisce mai i codici stessi (sono già stati mostrati alla generazione).
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

    const { data, error } = await supabaseAdmin
      .from('user_mfa_backup_codes')
      .select('used_at')
      .eq('user_id', user.id);
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const total = (data || []).length;
    const unused = (data || []).filter((r) => !r.used_at).length;
    return NextResponse.json(
      { ok: true, total, unused },
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
