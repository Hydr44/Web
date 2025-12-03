import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFatturaPAXML } from '@/lib/sdi/xml-generator';
import { createArubaClient } from '@/lib/billing/aruba-client';
import { generateSDIFileName } from '@/lib/sdi/soap-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id richiesto' }, { status: 400 });
    }

    // 1. Recupera fattura dal database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
    }

    // 2. Genera XML FatturaPA (usa la tua funzione esistente)
    // Nota: potresti dover adattare questa parte in base alla tua struttura dati
    const invoiceXml = generateFatturaPAXML({
      // ... mappa i dati della fattura al formato FatturaPA
      // Usa la stessa logica che hai già in invoiceToFatturaPAData
    });

    // 3. Genera nome file conforme SDI
    const vatNumber = invoice.meta?.sdi?.cedente_prestatore?.id_fiscale_iva?.id_codice || '02166430856';
    const invoiceNumber = invoice.number || '00001';
    const fileName = generateSDIFileName(vatNumber, invoiceNumber);

    // 4. Invia ad Aruba
    const arubaClient = createArubaClient();
    if (!arubaClient) {
      return NextResponse.json(
        { error: 'Aruba non configurato. Impostare ARUBA_API_KEY' },
        { status: 500 }
      );
    }

    const arubaResponse = await arubaClient.sendInvoice({
      xml: invoiceXml,
      fileName,
      metadata: {
        invoiceId: invoice.id,
        customerName: invoice.customer_name,
        invoiceNumber: invoice.number,
      },
    });

    if (!arubaResponse.success) {
      return NextResponse.json(
        { error: arubaResponse.error || 'Errore invio ad Aruba' },
        { status: 500 }
      );
    }

    // 5. Aggiorna fattura con ID Aruba
    await supabase
      .from('invoices')
      .update({
        sdi_status: 'sent',
        meta: {
          ...invoice.meta,
          aruba: {
            invoice_id: arubaResponse.invoiceId,
            sdi_id: arubaResponse.sdiId,
            status: arubaResponse.status,
            sent_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', invoice_id);

    return NextResponse.json({
      success: true,
      invoice_id: invoice_id,
      aruba_invoice_id: arubaResponse.invoiceId,
      sdi_id: arubaResponse.sdiId,
      status: arubaResponse.status,
    });

  } catch (error: any) {
    console.error('[Aruba] Errore:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}

