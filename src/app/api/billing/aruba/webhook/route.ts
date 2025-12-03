import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Webhook endpoint per ricevere notifiche da Aruba
 * 
 * Aruba chiama questo endpoint quando:
 * - Fattura inviata a SDI
 * - Fattura accettata/rifiutata da SDI
 * - Fattura consegnata al destinatario
 * - Errori durante l'invio
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Verifica firma webhook Aruba (se prevista)
    // const signature = request.headers.get('X-Aruba-Signature');
    // if (!verifyArubaSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Firma non valida' }, { status: 401 });
    // }

    const {
      event_type, // 'invoice.sent', 'invoice.accepted', 'invoice.rejected', ecc.
      invoice_id, // ID Aruba della fattura
      sdi_id, // Identificativo SDI
      status, // 'sent', 'accepted', 'rejected', 'delivered', ecc.
      invoice_number, // Numero fattura
      error_message, // Se c'è un errore
      metadata, // Metadata aggiuntive (invoiceId tuo, ecc.)
    } = body;

    console.log('[Aruba Webhook] Evento ricevuto:', {
      event_type,
      invoice_id,
      sdi_id,
      status,
      metadata,
    });

    // Trova la fattura nel database usando metadata.invoiceId o invoice_number
    let invoiceId: string | null = null;

    if (metadata?.invoiceId) {
      invoiceId = metadata.invoiceId;
    } else if (invoice_number) {
      // Cerca per numero fattura
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('number', invoice_number)
        .single();
      
      if (invoice) {
        invoiceId = invoice.id;
      }
    }

    if (!invoiceId) {
      console.warn('[Aruba Webhook] Fattura non trovata:', { invoice_number, metadata });
      // Non restituire errore, Aruba potrebbe chiamare più volte
      return NextResponse.json({ received: true });
    }

    // Mappa status Aruba a status SDI
    const sdiStatusMap: Record<string, string> = {
      'sent': 'sent',
      'accepted': 'accepted',
      'rejected': 'rejected',
      'delivered': 'delivered',
      'error': 'error',
    };

    const sdiStatus = sdiStatusMap[status] || status;

    // Aggiorna fattura con nuovo status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        sdi_status: sdiStatus,
        meta: {
          aruba: {
            invoice_id,
            sdi_id,
            status,
            event_type,
            updated_at: new Date().toISOString(),
            error_message: error_message || null,
          },
        },
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('[Aruba Webhook] Errore aggiornamento fattura:', updateError);
      return NextResponse.json(
        { error: 'Errore aggiornamento fattura' },
        { status: 500 }
      );
    }

    // Registra evento SDI (se hai una tabella sdi_events)
    await supabase.from('sdi_events').insert({
      invoice_id: invoiceId,
      event_type: event_type || status,
      payload: {
        aruba_invoice_id: invoice_id,
        sdi_id,
        status,
        error_message,
      },
    }).catch(err => {
      // Ignora errore se tabella non esiste
      console.warn('[Aruba Webhook] Tabella sdi_events non disponibile:', err);
    });

    console.log('[Aruba Webhook] Fattura aggiornata:', { invoiceId, sdiStatus });

    return NextResponse.json({ received: true, invoice_id: invoiceId });

  } catch (error: any) {
    console.error('[Aruba Webhook] Errore:', error);
    // Restituisci sempre 200 per evitare che Aruba riprovi
    return NextResponse.json({ received: true, error: error.message });
  }
}

