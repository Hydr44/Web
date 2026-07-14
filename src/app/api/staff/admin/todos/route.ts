/**
 * Lista "Da fare" condivisa del team (dev_tasks).
 * Blocco note operativo visibile in admin: sia lo staff sia l'assistente AI
 * (che scrive via service-role) leggono/scrivono qui, così non si perde nulla.
 * GET lista / POST crea. Qualsiasi staff autenticato può leggere e scrivere.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

const STATUSES = ['open', 'doing', 'done'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  // open/doing prima (per priorità), poi le fatte in fondo per data.
  const { data, error } = await supabaseAdmin
    .from('dev_tasks')
    .select('*')
    .order('status', { ascending: true })
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    // Tabella non ancora creata: non rompere l'admin, segnala e basta.
    // PostgREST intercetta la tabella mancante come PGRST205 (schema cache),
    // Postgres grezzo come 42P01. Coprili entrambi + fallback sul messaggio.
    if (
      (error as { code?: string }).code === '42P01' ||
      (error as { code?: string }).code === 'PGRST205' ||
      /relation .*dev_tasks.* does not exist/i.test(error.message) ||
      /find the table .*dev_tasks/i.test(error.message)
    ) {
      return NextResponse.json({ success: true, tasks: [], tableMissing: true }, { headers });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  }
  return NextResponse.json({ success: true, tasks: data || [] }, { headers });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  try {
    const b = await request.json();
    const title = String(b.title || '').trim();
    if (title.length < 2) return NextResponse.json({ success: false, error: 'Titolo obbligatorio' }, { status: 400, headers });
    const status = STATUSES.includes(b.status) ? b.status : 'open';
    const priority = PRIORITIES.includes(b.priority) ? b.priority : 'medium';
    const { data, error } = await supabaseAdmin.from('dev_tasks').insert({
      title,
      detail: b.detail ? String(b.detail).trim() : null,
      status,
      priority,
      area: b.area ? String(b.area).trim() : null,
      created_by: 'user',
      position: Number.isFinite(b.position) ? Math.trunc(b.position) : 0,
      done_at: status === 'done' ? new Date().toISOString() : null,
    }).select('*').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    return NextResponse.json({ success: true, task: data }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
