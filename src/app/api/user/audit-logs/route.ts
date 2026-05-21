import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * GET  /api/user/audit-logs            — lista (max 100) audit log per l'utente
 * POST /api/user/audit-logs  { action, status?, metadata? }
 *                                       — scrive un evento per l'utente in sessione
 */

const VALID_STATUS = ['success', 'failure'];

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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);

    const { data, error } = await supabaseAdmin
      .from('user_audit_logs')
      .select('id, action, status, ip, user_agent, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
    return NextResponse.json(
      { ok: true, logs: data || [] },
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

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));
    const { action, status, metadata } = body as {
      action?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    };

    if (!action || typeof action !== 'string' || action.length > 100) {
      return NextResponse.json(
        { ok: false, error: 'action richiesta (string, max 100 char)' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }
    const st = status && VALID_STATUS.includes(status) ? status : 'success';

    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;
    const ua = request.headers.get('user-agent') || null;

    const { error } = await supabaseAdmin.from('user_audit_logs').insert({
      user_id: user.id,
      action,
      status: st,
      ip,
      user_agent: ua,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
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
