/**
 * POST /api/staff/admin/leads/:id/quotes/:qid/cancel
 * Annulla preventivo (status='cancelled').
 *
 * Funziona da qualsiasi stato eccetto 'activated' (account già creato, no rollback).
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

    if (quote.status === 'activated') {
      return NextResponse.json({
        success: false,
        error: 'Impossibile annullare: l\'account è già stato attivato. Per disattivare il cliente vai sul dettaglio cliente.',
      }, { status: 400, headers: corsHeaders(origin) });
    }

    if (quote.status === 'cancelled') {
      return NextResponse.json({ success: true, message: 'Preventivo già annullato' }, { headers: corsHeaders(origin) });
    }

    const { error: uErr } = await supabaseAdmin
      .from('lead_quotes')
      .update({
        status: 'cancelled',
        rejection_reason: body.reason || 'Annullato dallo staff',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', params.qid);

    if (uErr) {
      return NextResponse.json({ success: false, error: uErr.message }, { status: 500, headers: corsHeaders(origin) });
    }

    // Chiude eventuali task automatiche per questo preventivo
    await supabaseAdmin.from('lead_tasks').update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('lead_id', quote.lead_id)
    .eq('status', 'open')
    .ilike('title', `%${quote.quote_number}%`);

    await supabaseAdmin.from('lead_activities').insert({
      lead_id: quote.lead_id,
      activity_type: 'quote_cancelled',
      title: `Preventivo ${quote.quote_number} annullato dallo staff`,
      description: body.reason || null,
      performed_by: body.cancelled_by || null,
      performed_by_type: 'staff',
      related_quote_id: params.qid,
    });

    return NextResponse.json({
      success: true,
      message: 'Preventivo annullato',
      previous_status: quote.status,
    }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
