/**
 * Lista "Da fare" condivisa — modifica (PATCH) / elimina (DELETE) un task.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

const STATUSES = ['open', 'doing', 'done'];
const PRIORITIES = ['high', 'medium', 'low'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  try {
    const b = await request.json();
    const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.title !== undefined) {
      const t = String(b.title).trim();
      if (t.length < 2) return NextResponse.json({ success: false, error: 'Titolo troppo corto' }, { status: 400, headers });
      upd.title = t;
    }
    if (b.detail !== undefined) upd.detail = b.detail ? String(b.detail).trim() : null;
    if (b.area !== undefined) upd.area = b.area ? String(b.area).trim() : null;
    if (b.priority !== undefined && PRIORITIES.includes(b.priority)) upd.priority = b.priority;
    if (b.position !== undefined && Number.isFinite(b.position)) upd.position = Math.trunc(b.position);
    if (b.status !== undefined && STATUSES.includes(b.status)) {
      upd.status = b.status;
      // done_at coerente con lo stato: valorizza entrando in 'done', azzera uscendo.
      upd.done_at = b.status === 'done' ? new Date().toISOString() : null;
    }
    const { data, error } = await supabaseAdmin.from('dev_tasks').update(upd).eq('id', params.id).select('*').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    return NextResponse.json({ success: true, task: data }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  const { error } = await supabaseAdmin.from('dev_tasks').delete().eq('id', params.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  return NextResponse.json({ success: true }, { headers });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
