/**
 * PATCH  /api/staff/admin/newsletter/campaigns/:id  → modifica bozza (title/subject/body/status)
 * DELETE /api/staff/admin/newsletter/campaigns/:id  → elimina bozza (solo non inviate)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  if (!requireStaffRole(staff, 'admin', 'manager')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers: corsHeaders(origin) });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const patch: Record<string, unknown> = {};
    if (typeof body.title === 'string') patch.title = body.title;
    if (typeof body.subject === 'string') patch.subject = body.subject;
    if (typeof body.body_html === 'string') patch.body_html = body.body_html;
    if (body.status === 'draft' || body.status === 'ready') patch.status = body.status;
    if (!Object.keys(patch).length) {
      return NextResponse.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400, headers: corsHeaders(origin) });
    }

    // Non si modifica una campagna già inviata.
    const { data, error } = await supabaseAdmin
      .from('newsletter_campaigns')
      .update(patch)
      .eq('id', params.id)
      .neq('status', 'sent')
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    return NextResponse.json({ success: true, campaign: data }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  if (!requireStaffRole(staff, 'admin', 'manager')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers: corsHeaders(origin) });
  }

  const { error } = await supabaseAdmin
    .from('newsletter_campaigns')
    .delete()
    .eq('id', params.id)
    .neq('status', 'sent');
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
}
