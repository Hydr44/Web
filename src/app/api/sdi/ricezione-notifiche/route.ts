// API endpoint per ricezione notifiche dal Sistema di Interscambio (SDI)
// Endpoint: POST /api/sdi/ricezione-notifiche
// 
// Questo endpoint riceve notifiche di esito dal SDI per fatture emesse:
// - RicevutaConsegna (RC): Fattura consegnata con successo
// - NotificaMancataConsegna (MC): Errore consegna
// - NotificaScarto (NS): Fattura scartata
// - NotificaEsito (NE): Esito committente (accettazione/rifiuto)
// - NotificaDecorrenzaTermini (DT): Accettazione tacita

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSDIResponse, parseSDINotification } from '../_utils';

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
    // Ricevi XML notifica dal SDI
    const contentType = request.headers.get('content-type') || '';
    
    let xml: string;
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xml = await request.text();
    } else if (contentType.includes('application/json')) {
      // SDI può inviare anche JSON wrapper
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

    console.log('[SDI] Notifica ricevuta:', {
      length: xml.length,
      preview: xml.substring(0, 200),
    });

    // Parse XML notifica
    const notificaData = parseSDINotification(xml);

    // Inizializza Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[SDI] Credenziali Supabase mancanti');
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
      console.warn('[SDI] Fattura non trovata per notifica:', notificaData);
      // Registra comunque la notifica per tracciabilità
      await supabase.from('sdi_events').insert({
        event_type: notificaData.tipoNotifica || 'NotificaSconosciuta',
        payload: {
          notifica_data: notificaData,
          xml: xml,
          received_at: new Date().toISOString(),
          invoice_not_found: true,
        },
      });

      return createSDIResponse(
        {
          success: true,
          message: 'Notifica ricevuta ma fattura non trovata',
        },
        200
      );
    }

    // Determina nuovo stato in base al tipo di notifica
    let newStatus = 'sent';
    let statusMessage = 'Notifica ricevuta';

    switch (notificaData.tipoNotifica) {
      case 'RicevutaConsegna':
      case 'RC':
        newStatus = 'delivered';
        statusMessage = 'Fattura consegnata con successo';
        break;

      case 'NotificaMancataConsegna':
      case 'MC':
        newStatus = 'delivery_failed';
        statusMessage = 'Errore consegna fattura';
        break;

      case 'NotificaScarto':
      case 'NS':
        newStatus = 'rejected';
        statusMessage = 'Fattura scartata dal SDI';
        break;

      case 'NotificaEsito':
      case 'NE':
        // Verifica esito committente
        newStatus = notificaData.esito === 'accettato' ? 'delivered' : 'rejected';
        statusMessage = `Esito committente: ${notificaData.esito}`;
        break;

      case 'NotificaDecorrenzaTermini':
      case 'DT':
        newStatus = 'delivered'; // Accettazione tacita
        statusMessage = 'Accettazione tacita (decorrenza termini)';
        break;

      default:
        newStatus = 'pending';
        statusMessage = `Notifica tipo: ${notificaData.tipoNotifica}`;
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
          },
          updated_at: new Date().toISOString(),
        },
      })
      .eq('id', invoiceId);

    // Registra evento SDI
    await supabase.from('sdi_events').insert({
      invoice_id: invoiceId,
      event_type: notificaData.tipoNotifica || 'NotificaSconosciuta',
      payload: {
        notifica_data: notificaData,
        new_status: newStatus,
        xml: xml,
        received_at: new Date().toISOString(),
      },
    });

    console.log('[SDI] Notifica processata:', {
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
    console.error('[SDI] Errore ricezione notifica:', error);
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore elaborazione notifica',
      },
      500
    );
  }
}

