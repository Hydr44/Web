/**
 * GET  /api/staff/admin/newsletter/campaigns  → lista campagne (bozze + inviate)
 * POST /api/staff/admin/newsletter/campaigns  → crea bozza (da eventi o vuota)
 *
 * Body POST: { event_ids?: string[], title?, subject?, body_html? }
 * Se event_ids presenti → genera titolo/oggetto/HTML col template normativo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { templateFromEvents, type RegEvent } from '@/lib/newsletterCampaign';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });

  const { data, error } = await supabaseAdmin
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  return NextResponse.json({ success: true, campaigns: data || [] }, { headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  if (!requireStaffRole(staff, 'admin', 'manager')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers: corsHeaders(origin) });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const eventIds: string[] = Array.isArray(body.event_ids) ? body.event_ids.filter((x: any) => typeof x === 'string') : [];

    let title: string = typeof body.title === 'string' ? body.title : '';
    let subject: string = typeof body.subject === 'string' ? body.subject : '';
    let html: string = typeof body.body_html === 'string' ? body.body_html : '';

    if (eventIds.length) {
      const { data: events } = await supabaseAdmin
        .from('regulatory_monitor_events')
        .select('id, group_label, label, url, added, summary, detected_at')
        .in('id', eventIds);
      const tpl = templateFromEvents((events || []) as RegEvent[]);
      title = title || tpl.title;
      subject = subject || tpl.subject;
      html = html || tpl.html;
    }

    if (!subject) subject = 'Newsletter RescueManager';
    if (!title) title = subject;

    const { data, error } = await supabaseAdmin
      .from('newsletter_campaigns')
      .insert({
        title,
        subject,
        body_html: html,
        status: 'draft',
        source_event_ids: eventIds.length ? eventIds : null,
        created_by: staff.email || staff.sub || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    return NextResponse.json({ success: true, campaign: data }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}
