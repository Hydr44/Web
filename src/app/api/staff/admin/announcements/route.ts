import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

/**
 * CRUD avvisi (staff). Auth staff JWT via middleware su /api/staff/admin/*.
 *  GET    → lista tutti gli avvisi
 *  POST   → crea
 *  PATCH  → aggiorna { id, ...campi }
 *  DELETE ?id=...
 */
const LEVELS = ['info', 'warning', 'success', 'critical'];
const TARGETS = ['all', 'web', 'desktop', 'mobile'];

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message, tableMissing: true, announcements: [] },
      { headers: corsHeaders(origin) },
    );
  }
  return NextResponse.json({ success: true, announcements: data || [] }, { headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const b = await request.json().catch(() => ({}));
  const title = String(b.title || '').trim();
  const body = String(b.body || '').trim();
  if (title.length < 2 || body.length < 2) {
    return NextResponse.json({ success: false, error: 'Titolo e testo obbligatori' }, { status: 400, headers: corsHeaders(origin) });
  }
  const row = {
    title,
    body,
    level: LEVELS.includes(b.level) ? b.level : 'info',
    target: TARGETS.includes(b.target) ? b.target : 'all',
    active: b.active !== false,
    dismissible: b.dismissible !== false,
    starts_at: b.starts_at || null,
    ends_at: b.ends_at || null,
  };
  const { data, error } = await supabaseAdmin.from('announcements').insert(row).select().maybeSingle();
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  }
  return NextResponse.json({ success: true, announcement: data }, { headers: corsHeaders(origin) });
}

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get('origin');
  const b = await request.json().catch(() => ({}));
  const id = String(b.id || '');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400, headers: corsHeaders(origin) });
  }
  const patch: Record<string, unknown> = {};
  for (const k of ['title', 'body', 'level', 'target', 'active', 'dismissible', 'starts_at', 'ends_at']) {
    if (k in b) patch[k] = b[k];
  }
  if (patch.level && !LEVELS.includes(patch.level as string)) delete patch.level;
  if (patch.target && !TARGETS.includes(patch.target as string)) delete patch.target;
  const { error } = await supabaseAdmin.from('announcements').update(patch).eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  }
  return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400, headers: corsHeaders(origin) });
  }
  const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  }
  return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
