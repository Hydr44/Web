// API endpoint di TEST per ricezione notifiche dal Sistema di Interscambio (SDI)
// Endpoint: POST /api/sdi/test/ricezione-notifiche
// 
// Questo endpoint è per l'ambiente di TEST del SDI
// Non deve essere usato in produzione

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSDIResponse, parseSDINotification } from '../../_utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gestisce richieste OPTIONS per CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Ricevi XML notifica dal SDI (ambiente di test)
    const contentType = request.headers.get('content-type') || '';
    
    let xml: string;
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xml = await request.text();
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      xml = body.xml || body.notifica || JSON.stringify(body);
    } else {
      xml = await request.text();
    }

    if (!xml || xml.trim().length === 0) {
      return createSDIResponse(
        { success: false, error: 'XML notifica mancante o vuoto' },
        400
      );
    }

    console.log('[SDI TEST] Notifica ricevuta:', {
      length: xml.length,
      preview: xml.substring(0, 200),
      environment: 'TEST',
    });

    // Parse XML notifica
    const notificaData = parseSDINotification(xml);

    // Inizializza Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[SDI TEST] Credenziali Supabase mancanti');
      return createSDIResponse(
        { success: false, error: 'Configurazione server errata' },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Trova fattura per identificativo SDI o numero fattura
    let invoiceId: string | null = null;

    if (notificaData.identificativoSDI || notificaData.idSDI) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .or(
          `provider_ext_id.eq.${notificaData.identificativoSDI},provider_ext_id.eq.${notificaData.idSDI}`
        )
        .single();

      if (invoice) {
        invoiceId = invoice.id;
      }
    }

    if (!invoiceId) {
      console.warn('[SDI TEST] Fattura non trovata per notifica:', notificaData);
      // Registra comunque la notifica per tracciabilità
      await supabase.from('sdi_events').insert({
        event_type: `${notificaData.tipoNotifica || 'NotificaSconosciuta'}_TEST`,
        payload: {
          notifica_data: notificaData,
          xml: xml,
          received_at: new Date().toISOString(),
          invoice_not_found: true,
          environment: 'TEST',
        },
      });

      return createSDIResponse(
        {
          success: true,
          message: 'Notifica ricevuta ma fattura non trovata (TEST)',
        },
        200
      );
    }

    // Determina nuovo stato in base al tipo di notifica
    let newStatus = 'sent';
    let statusMessage = 'Notifica ricevuta (TEST)';

    switch (notificaData.tipoNotifica) {
      case 'RicevutaConsegna':
      case 'RC':
        newStatus = 'delivered';
        statusMessage = 'Fattura consegnata con successo (TEST)';
        break;

      case 'NotificaMancataConsegna':
      case 'MC':
        newStatus = 'delivery_failed';
        statusMessage = 'Errore consegna fattura (TEST)';
        break;

      case 'NotificaScarto':
      case 'NS':
        newStatus = 'rejected';
        statusMessage = 'Fattura scartata dal SDI (TEST)';
        break;

      case 'NotificaEsito':
      case 'NE':
        newStatus = notificaData.esito === 'accettato' ? 'delivered' : 'rejected';
        statusMessage = `Esito committente: ${notificaData.esito} (TEST)`;
        break;

      case 'NotificaDecorrenzaTermini':
      case 'DT':
        newStatus = 'delivered';
        statusMessage = 'Accettazione tacita (decorrenza termini) (TEST)';
        break;

      default:
        newStatus = 'pending';
        statusMessage = `Notifica tipo: ${notificaData.tipoNotifica} (TEST)`;
    }

    // Aggiorna stato fattura
    await supabase
      .from('invoices')
      .update({
        sdi_status: newStatus,
        provider_ext_id: notificaData.identificativoSDI || notificaData.idSDI,
        meta: {
          sdi_notification: {
            tipo: notificaData.tipoNotifica,
            esito: notificaData.esito,
            received_at: new Date().toISOString(),
            xml: xml,
            environment: 'TEST',
          },
          updated_at: new Date().toISOString(),
        },
      })
      .eq('id', invoiceId);

    // Registra evento SDI (test)
    await supabase.from('sdi_events').insert({
      invoice_id: invoiceId,
      event_type: `${notificaData.tipoNotifica || 'NotificaSconosciuta'}_TEST`,
      payload: {
        notifica_data: notificaData,
        new_status: newStatus,
        xml: xml,
        received_at: new Date().toISOString(),
        environment: 'TEST',
      },
    });

    console.log('[SDI TEST] Notifica processata:', {
      invoice_id: invoiceId,
      tipo: notificaData.tipoNotifica,
      new_status: newStatus,
    });

    return createSDIResponse({
      success: true,
      message: statusMessage,
      invoice_id: invoiceId,
      notification_id: notificaData.identificativoSDI || notificaData.idSDI,
    });

  } catch (error: any) {
    console.error('[SDI TEST] Errore ricezione notifica:', error);
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore elaborazione notifica',
      },
      500
    );
  }
}

