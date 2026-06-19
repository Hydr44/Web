import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { brandedHtml, BRAND_BLUE, BRAND_DARK, EMAIL_FONT } from '@/lib/email-template';

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

function buildQuoteEmailHtml(quote: any): { html: string; text: string } {
  const itemsRows = (quote.items || []).map((item: any) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;">${item.description || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;text-align:right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;text-align:right;font-weight:600;">${formatCurrency(item.quantity * item.unit_price)}</td>
    </tr>`
  ).join('');

  const validUntilStr = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  // Tabella voci di preventivo (HTML già brandizzato, passato come extraHtml).
  const itemsTable = `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;margin:8px 0 24px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;color:#64748b;font-family:${EMAIL_FONT};font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;">Descrizione</th>
        <th style="padding:10px 12px;text-align:center;color:#64748b;font-family:${EMAIL_FONT};font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;">Qtà</th>
        <th style="padding:10px 12px;text-align:right;color:#64748b;font-family:${EMAIL_FONT};font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;">Prezzo</th>
        <th style="padding:10px 12px;text-align:right;color:#64748b;font-family:${EMAIL_FONT};font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;">Totale</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>`;

  // Riepilogo totali (HTML già brandizzato, passato come extraHtml).
  const totalsTable = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td style="padding:4px 12px;color:#64748b;font-family:${EMAIL_FONT};font-size:14px;">Subtotale</td>
      <td style="padding:4px 12px;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;text-align:right;">${formatCurrency(quote.subtotal)}</td>
    </tr>
    <tr>
      <td style="padding:4px 12px;color:#64748b;font-family:${EMAIL_FONT};font-size:14px;">IVA (${quote.vat_rate}%)</td>
      <td style="padding:4px 12px;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;text-align:right;">${formatCurrency(quote.vat_amount)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;color:#0f172a;font-family:${EMAIL_FONT};font-size:18px;font-weight:700;border-top:2px solid #e2e8f0;">Totale</td>
      <td style="padding:8px 12px;color:${BRAND_BLUE};font-family:${EMAIL_FONT};font-size:18px;font-weight:700;text-align:right;border-top:2px solid #e2e8f0;">${formatCurrency(quote.total)}</td>
    </tr>
  </table>`;

  const notesBlock = quote.notes
    ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-left:4px solid ${BRAND_BLUE};margin:0 0 24px;"><tr><td style="padding:12px 16px;">
    <p style="margin:0 0 4px;color:#64748b;font-family:${EMAIL_FONT};font-size:11px;text-transform:uppercase;letter-spacing:1px;">Note</p>
    <p style="margin:0;color:#0f172a;font-family:${EMAIL_FONT};font-size:14px;line-height:1.5;">${quote.notes.replace(/\n/g, '<br>')}</p>
  </td></tr></table>` : '';

  const validUntilBlock = validUntilStr
    ? `
  <p style="margin:0 0 8px;color:#94a3b8;font-family:${EMAIL_FONT};font-size:13px;">Preventivo valido fino al <strong style="color:${BRAND_DARK};">${validUntilStr}</strong></p>` : '';

  const bodyText = [
    `Gentile <strong>${quote.client_name}</strong>,`,
    'Di seguito il preventivo richiesto per i nostri servizi. Siamo lieti di fornirle la nostra migliore offerta.',
  ].join('\n');

  const html = brandedHtml(bodyText, {
    subtitle: 'Preventivo',
    infoRows: [{ label: 'Oggetto', value: quote.subject }],
    extraHtml: `${itemsTable}${totalsTable}${notesBlock}${validUntilBlock}
  <p style="margin:24px 0 0;color:#475569;font-family:${EMAIL_FONT};font-size:15px;line-height:1.65;">Per accettare il preventivo o per qualsiasi domanda, non esiti a contattarci rispondendo a questa email o visitando il nostro sito.</p>`,
  });

  const text = `Preventivo - ${quote.subject}\n\nGentile ${quote.client_name},\n\nTotale: ${formatCurrency(quote.total)} (IVA ${quote.vat_rate}% inclusa)\n\n${quote.notes || ''}\n\nRescueManager - rescuemanager.eu`;

  return { html, text };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');

    // Load quote
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('admin_quotes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404, headers: corsHeaders(origin) });
    }

    if (!quote.client_email) {
      return NextResponse.json({ success: false, error: 'Email cliente mancante' }, { status: 400, headers: corsHeaders(origin) });
    }

    // Build email
    const { html, text } = buildQuoteEmailHtml(quote);

    // Send via Supabase Edge Function (Resend)
    let emailSent = false;
    let emailError = '';

    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          type: 'custom',
          to: quote.client_email,
          subject: `Preventivo: ${quote.subject}`,
          data: { html, text },
        }),
      });

      if (res.ok) {
        emailSent = true;
      } else {
        emailError = await res.text();
        console.error('Email send error:', emailError);
      }
    } catch (err: any) {
      emailError = err.message;
      console.error('Email send exception:', err);
    }

    // Update quote status
    await supabaseAdmin
      .from('admin_quotes')
      .update({
        status: emailSent ? 'sent' : 'draft',
        sent_at: emailSent ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (!emailSent) {
      return NextResponse.json({
        success: false,
        error: `Errore invio email: ${emailError}`
      }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({
      success: true,
      message: `Preventivo inviato a ${quote.client_email}`
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Quote send error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
