/**
 * POST /api/staff/admin/leads/:id/quotes/:qid/approve
 * Approva un preventivo in stato pending_approval — passa a 'draft' pronto per invio.
 *
 * Body opzionale:
 *   approved_by: uuid (staff user)
 *   notes: string
 *
 * POST con ?action=reject per rifiutarlo invece (status='rejected')
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(
  request: Request,
  { params }: { params: { id: string; qid: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'approve';
    const body = await request.json().catch(() => ({}));

    const { data: quote, error: qErr } = await supabaseAdmin
      .from('lead_quotes')
      .select('id, status, quote_number, lead_id')
      .eq('id', params.qid)
      .eq('lead_id', params.id)
      .single();

    if (qErr || !quote) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404, headers: corsHeaders(origin) });
    }

    if (quote.status !== 'pending_approval') {
      return NextResponse.json({
        success: false,
        error: `Preventivo in stato '${quote.status}' — solo i preventivi in 'pending_approval' possono essere approvati/rifiutati.`
      }, { status: 400, headers: corsHeaders(origin) });
    }

    const newStatus = action === 'reject' ? 'rejected' : 'draft';
    const updatePayload: Record<string, any> = {
      status: newStatus,
      approved_by: body.approved_by || null,
      approved_at: new Date().toISOString(),
    };
    if (action === 'reject') {
      updatePayload.rejected_at = new Date().toISOString();
      updatePayload.rejection_reason = body.notes || 'Rifiutato in fase di approvazione';
    }

    const { error: uErr } = await supabaseAdmin
      .from('lead_quotes')
      .update(updatePayload)
      .eq('id', params.qid);

    if (uErr) {
      return NextResponse.json({ success: false, error: uErr.message }, { status: 500, headers: corsHeaders(origin) });
    }

    // Activity log
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: quote.lead_id,
      activity_type: action === 'reject' ? 'quote_rejected_internal' : 'quote_approved',
      title: action === 'reject'
        ? `Preventivo ${quote.quote_number} rifiutato in approvazione`
        : `Preventivo ${quote.quote_number} approvato — pronto per invio`,
      description: body.notes || null,
      performed_by: body.approved_by || null,
      performed_by_type: 'staff',
      related_quote_id: params.qid,
    });

    return NextResponse.json({
      success: true,
      message: action === 'reject' ? 'Preventivo rifiutato' : 'Preventivo approvato',
      status: newStatus,
    }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
