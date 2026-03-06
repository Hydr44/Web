import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

function buildQuoteEmailHtml(quote: any): { html: string; text: string } {
  const itemsHtml = (quote.items || []).map((item: any) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#333;font-size:14px;">${item.description || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#333;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#333;font-size:14px;text-align:right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#333;font-size:14px;text-align:right;font-weight:600;">${formatCurrency(item.quantity * item.unit_price)}</td>
    </tr>`
  ).join('');

  const validUntilStr = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="650" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#3b82f6,#10b981);padding:30px 40px;border-radius:8px 8px 0 0;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:600;">RescueManager</h1>
  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Preventivo</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
  <p style="margin:0 0 20px;color:#333;font-size:16px;">
    Gentile <strong>${quote.client_name}</strong>,
  </p>
  <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
    Di seguito il preventivo richiesto per i nostri servizi. Siamo lieti di fornirle la nostra migliore offerta.
  </p>

  <!-- Quote details -->
  <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:24px;">
    <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Oggetto</p>
    <p style="margin:0;color:#333;font-size:16px;font-weight:600;">${quote.subject}</p>
  </div>

  <!-- Items table -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e9ecef;border-radius:8px;margin-bottom:24px;">
    <thead>
      <tr style="background:#f8f9fa;">
        <th style="padding:10px 12px;text-align:left;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e9ecef;">Descrizione</th>
        <th style="padding:10px 12px;text-align:center;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e9ecef;">Qtà</th>
        <th style="padding:10px 12px;text-align:right;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e9ecef;">Prezzo</th>
        <th style="padding:10px 12px;text-align:right;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e9ecef;">Totale</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <!-- Totals -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="padding:4px 12px;color:#666;font-size:14px;">Subtotale</td>
      <td style="padding:4px 12px;color:#333;font-size:14px;text-align:right;">${formatCurrency(quote.subtotal)}</td>
    </tr>
    <tr>
      <td style="padding:4px 12px;color:#666;font-size:14px;">IVA (${quote.vat_rate}%)</td>
      <td style="padding:4px 12px;color:#333;font-size:14px;text-align:right;">${formatCurrency(quote.vat_amount)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;color:#333;font-size:18px;font-weight:700;border-top:2px solid #e9ecef;">Totale</td>
      <td style="padding:8px 12px;color:#10b981;font-size:18px;font-weight:700;text-align:right;border-top:2px solid #e9ecef;">${formatCurrency(quote.total)}</td>
    </tr>
  </table>

  ${quote.notes ? `
  <div style="background:#f0f9ff;border-left:3px solid #3b82f6;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:24px;">
    <p style="margin:0 0 4px;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Note</p>
    <p style="margin:0;color:#333;font-size:14px;line-height:1.5;">${quote.notes.replace(/\n/g, '<br>')}</p>
  </div>` : ''}

  ${validUntilStr ? `
  <p style="margin:0 0 24px;color:#999;font-size:13px;">
    Preventivo valido fino al <strong>${validUntilStr}</strong>
  </p>` : ''}

  <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
    Per accettare il preventivo o per qualsiasi domanda, non esiti a contattarci rispondendo a questa email o visitando il nostro sito.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8f9fa;padding:20px 40px;border-radius:0 0 8px 8px;border-top:1px solid #e9ecef;">
  <p style="margin:0;color:#999;font-size:12px;text-align:center;">
    &copy; ${new Date().getFullYear()} RescueManager - Software Gestionale per Autodemolizioni<br>
    <a href="https://rescuemanager.eu" style="color:#3b82f6;">rescuemanager.eu</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

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
