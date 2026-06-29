/**
 * POST /api/staff/admin/newsletter/campaigns/:id/send
 * Body: { mode: 'test' | 'all' }
 *   - 'test' → invia l'email solo allo staff (anteprima reale nella casella).
 *   - 'all'  → crea e invia una Resend Broadcast a tutta l'Audience, marca 'sent'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { sendEmail } from '@/lib/newsletter';
import { createBroadcast, sendBroadcast } from '@/lib/newsletterCampaign';

export const runtime = 'nodejs';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
  if (!requireStaffRole(staff, 'admin', 'manager')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers: corsHeaders(origin) });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'all' ? 'all' : 'test';

    const { data: c, error } = await supabaseAdmin
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();
    if (error || !c) return NextResponse.json({ success: false, error: 'Campagna non trovata' }, { status: 404, headers: corsHeaders(origin) });

    // ── Test: invia solo allo staff loggato ───────────────────────────────
    if (mode === 'test') {
      const ok = await sendEmail(staff.email, `[TEST] ${c.subject}`, c.body_html);
      if (!ok) return NextResponse.json({ success: false, error: 'Invio test fallito (verifica RESEND_API_KEY)' }, { status: 500, headers: corsHeaders(origin) });
      await supabaseAdmin.from('newsletter_campaigns').update({ test_sent_at: new Date().toISOString() }).eq('id', c.id);
      return NextResponse.json({ success: true, message: `Test inviato a ${staff.email}` }, { headers: corsHeaders(origin) });
    }

    // ── Invio a tutti: Resend Broadcast verso l'Audience ──────────────────
    if (c.status === 'sent') {
      return NextResponse.json({ success: false, error: 'Campagna già inviata' }, { status: 400, headers: corsHeaders(origin) });
    }

    const { count } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed');

    const broadcastId = await createBroadcast({ subject: c.subject, html: c.body_html, name: c.title });
    await sendBroadcast(broadcastId);

    await supabaseAdmin
      .from('newsletter_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        resend_broadcast_id: broadcastId,
        recipients_count: count ?? null,
      })
      .eq('id', c.id);

    return NextResponse.json({ success: true, message: `Newsletter inviata${count != null ? ` a ~${count} iscritti` : ''}.`, broadcast_id: broadcastId }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore invio' }, { status: 500, headers: corsHeaders(origin) });
  }
}
