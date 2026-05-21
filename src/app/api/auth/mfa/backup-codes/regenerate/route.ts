import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import crypto from 'node:crypto';

/**
 * POST /api/auth/mfa/backup-codes/regenerate
 *
 * Genera 10 codici di backup 2FA monouso per l'utente in sessione.
 * Revoca i codici precedenti (se esistono). I codici sono restituiti
 * in chiaro UNA SOLA VOLTA in questa response; nel DB resta solo
 * l'hash SHA-256 (mai il plaintext).
 *
 * Codici: 10 caratteri base32-like, formato "XXXX-XXXX-XX" (leggibili,
 * niente 0/O/1/I/L).
 */

const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 31 char, escluse confusioni
const NUM_CODES = 10;
const CODE_LEN = 10;

function generateCode(): string {
  const buf = crypto.randomBytes(CODE_LEN);
  let raw = '';
  for (let i = 0; i < CODE_LEN; i++) raw += ALPHA[buf[i] % ALPHA.length];
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 10)}`;
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

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

    const codes = Array.from({ length: NUM_CODES }, generateCode);
    const rows = codes.map((c) => ({
      user_id: user.id,
      code_hash: hashCode(c),
    }));

    // Revoca i codici precedenti dell'utente (regen = sostituzione completa)
    const { error: delErr } = await supabaseAdmin
      .from('user_mfa_backup_codes')
      .delete()
      .eq('user_id', user.id);
    if (delErr) {
      console.error('[mfa/backup-codes] delete error:', delErr);
      return NextResponse.json(
        { ok: false, error: delErr.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const { error: insErr } = await supabaseAdmin
      .from('user_mfa_backup_codes')
      .insert(rows);
    if (insErr) {
      console.error('[mfa/backup-codes] insert error:', insErr);
      return NextResponse.json(
        { ok: false, error: insErr.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { ok: true, codes },
      { headers: corsHeaders(origin) }
    );
  } catch (e: unknown) {
    console.error('[mfa/backup-codes/regenerate] error:', e);
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
