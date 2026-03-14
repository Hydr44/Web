/**
 * Public Quote API
 * GET  /api/quotes/:uuid - Visualizza preventivo pubblico
 * POST /api/quotes/:uuid - Accetta preventivo
 * No auth required - uses public_uuid
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { data: quote, error } = await supabaseAdmin
      .from('lead_quotes')
      .select('*, leads!lead_quotes_lead_id_fkey(name, company, email)')
      .eq('public_uuid', params.uuid)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { success: false, error: 'Preventivo non trovato' },
        { status: 404 }
      );
    }

    // Track view
    if (quote.status === 'sent' && !quote.viewed_at) {
      await supabaseAdmin
        .from('lead_quotes')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .eq('id', quote.id);
      quote.status = 'viewed';
      quote.viewed_at = new Date().toISOString();
    }

    // Strip internal fields
    const publicQuote = {
      quote_number: quote.quote_number,
      plan_type: quote.plan_type,
      base_modules: quote.base_modules,
      special_modules: quote.special_modules,
      customizations: quote.customizations,
      base_price: quote.base_price,
      special_modules_price: quote.special_modules_price,
      customizations_price: quote.customizations_price,
      discount_percent: quote.discount_percent,
      discount_amount: quote.discount_amount,
      monthly_total: quote.monthly_total,
      yearly_total: quote.yearly_total,
      setup_fee: quote.setup_fee,
      contract_duration: quote.contract_duration,
      payment_method: quote.payment_method,
      billing_frequency: quote.billing_frequency,
      special_terms: quote.special_terms,
      status: quote.status,
      quote_date: quote.quote_date,
      expiry_date: quote.expiry_date,
      pdf_url: quote.pdf_url,
      lead_name: quote.leads?.name,
      lead_company: quote.leads?.company,
      is_expired: new Date(quote.expiry_date) < new Date() && !['accepted', 'paid'].includes(quote.status),
    };

    return NextResponse.json({ success: true, quote: publicQuote });
  } catch (error: any) {
    console.error('[QUOTE] public view error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const body = await request.json();
    const { action } = body;

    const { data: quote, error } = await supabaseAdmin
      .from('lead_quotes')
      .select('*')
      .eq('public_uuid', params.uuid)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { success: false, error: 'Preventivo non trovato' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      if (!['sent', 'viewed'].includes(quote.status)) {
        return NextResponse.json(
          { success: false, error: 'Preventivo non accettabile in questo stato' },
          { status: 400 }
        );
      }

      if (new Date(quote.expiry_date) < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Preventivo scaduto' },
          { status: 400 }
        );
      }

      await supabaseAdmin
        .from('lead_quotes')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', quote.id);

      // Update lead status
      await supabaseAdmin
        .from('leads')
        .update({ status: 'quote_sent', updated_at: new Date().toISOString() })
        .eq('id', quote.lead_id);

      return NextResponse.json({
        success: true,
        message: 'Preventivo accettato! Verrai contattato per completare il pagamento.',
        checkout_url: null, // TODO: Stripe checkout URL
      });
    }

    if (action === 'reject') {
      if (!['sent', 'viewed'].includes(quote.status)) {
        return NextResponse.json(
          { success: false, error: 'Preventivo non rifiutabile in questo stato' },
          { status: 400 }
        );
      }

      const reason = body.reason || '';
      await supabaseAdmin
        .from('lead_quotes')
        .update({ status: 'rejected' })
        .eq('id', quote.id);

      // Log modification request if reason provided
      if (reason) {
        await supabaseAdmin
          .from('lead_quote_modifications')
          .insert({
            quote_id: quote.id,
            requested_by: 'client',
            modification_text: reason,
          });
      }

      return NextResponse.json({
        success: true,
        message: 'Preventivo rifiutato. Grazie per il feedback.',
      });
    }

    if (action === 'request_modification') {
      const modificationText = body.modification_text;
      if (!modificationText) {
        return NextResponse.json(
          { success: false, error: 'Testo modifica richiesto' },
          { status: 400 }
        );
      }

      await supabaseAdmin
        .from('lead_quote_modifications')
        .insert({
          quote_id: quote.id,
          requested_by: 'client',
          modification_text: modificationText,
          modules_to_add: body.modules_to_add || null,
          modules_to_remove: body.modules_to_remove || null,
          notes: body.notes || null,
        });

      return NextResponse.json({
        success: true,
        message: 'Richiesta di modifica inviata. Ti ricontatteremo al più presto.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Azione non valida. Usa: accept, reject, request_modification' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[QUOTE] public action error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno' },
      { status: 500 }
    );
  }
}
