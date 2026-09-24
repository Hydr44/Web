import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { brandedHtml } from '@/lib/email-template';

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Importo in euro, formato italiano (es. "1.788,00 euro"). */
function formatEuro(n: number): string {
  return `${new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)} euro`;
}

/** Oggetto dell'email: il fatto prima del nome. */
function quoteSubject(quote: any): string {
  return `Preventivo RescueManager per ${quote.subject || 'i tuoi servizi'}`;
}

function buildQuoteEmailHtml(quote: any): { html: string; text: string } {
  const validUntilStr = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // Una voce per riga: descrizione a sinistra, quantità e importo a destra.
  const rows: Array<[string, string]> = (quote.items || []).map((item: any) => {
    const qty = Number(item.quantity) || 1;
    const unit = Number(item.unit_price) || 0;
    const value = qty > 1
      ? `${qty} × ${formatEuro(unit)}, totale ${formatEuro(qty * unit)}`
      : formatEuro(unit);
    return [String(item.description || 'Voce'), value] as [string, string];
  });
  rows.push(
    ['Imponibile', formatEuro(quote.subtotal)],
    ['IVA', `${quote.vat_rate}%, ${formatEuro(quote.vat_amount)}`],
  );
  if (validUntilStr) rows.push(['Valido fino al', validUntilStr]);

  const bodyLines = ['Ecco il preventivo per i servizi di cui abbiamo parlato.'];
  if (quote.notes) bodyLines.push(String(quote.notes).replaceAll('\n', '<br>'));

  const sub = [quote.client_company || quote.client_name, validUntilStr ? `valido fino al ${validUntilStr}` : '']
    .filter(Boolean)
    .join(', ');

  const html = brandedHtml(bodyLines.join('\n'), {
    title: `Preventivo per ${quote.subject || 'i tuoi servizi'}`,
    sub,
    amount: { label: 'Totale, IVA inclusa', value: formatEuro(quote.total) },
    rows,
    note: 'Per accettare il preventivo o per cambiare qualcosa scrivi a info@rescuemanager.eu.',
    reason: 'Ricevi questa email perché hai chiesto un preventivo a RescueManager.',
  });

  const textLines = [
    `Preventivo per ${quote.subject || 'i tuoi servizi'}`,
    quote.client_name ? `Per ${quote.client_name}` : '',
    validUntilStr ? `Valido fino al ${validUntilStr}` : '',
    `Totale, IVA inclusa ${formatEuro(quote.total)}`,
    '',
    quote.notes || '',
    '',
    'Per accettare il preventivo o per cambiare qualcosa scrivi a info@rescuemanager.eu.',
  ].filter((l) => l !== undefined && l !== null);

  return { html, text: textLines.join('\n') };
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
          subject: quoteSubject(quote),
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
