// API endpoint unificato per ricezione fatture e notifiche dal SDI (ambiente PRODUZIONE)
// Endpoint: POST /api/sdi/ricezione
//
// Questo endpoint riceve sia fatture elettroniche che notifiche dal SDI di produzione
// IMPORTANTE: Il SDI invia richieste SOAP con MTOM, quindi dobbiamo gestire multipart/related

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSDIResponse, parseSDIXML, parseSDINotification } from '../_utils';
import { verifySDIRequest } from '@/lib/sdi/certificate-verification';
import { extractFileFromSOAPMTOM, createSOAPResponse, isSOAPRequest } from '@/lib/sdi/soap-reception';

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
    // Log dettagliato per debug
    const contentType = request.headers.get('content-type') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    
    console.log('[SDI] ========== RICEZIONE RICHIESTA ==========');
    console.log('[SDI] Content-Type:', contentType);
    console.log('[SDI] User-Agent:', userAgent);
    console.log('[SDI] X-Forwarded-For:', forwardedFor);
    console.log('[SDI] URL:', request.url);
    
    // Verifica che la richiesta provenga da SDI (produzione)
    // NOTA: In produzione, configurare verifica completa (IP whitelist, certificati)
    if (!verifySDIRequest(request, 'production')) {
      console.warn('[SDI] Richiesta non autorizzata da SDI');
      // In produzione, rifiutare la richiesta
      // Per ora, accettiamo tutte le richieste per testing
      // return createSDIResponse(
      //   { success: false, error: 'Richiesta non autorizzata' },
      //   401
      // );
    }

    // Estrai XML/file dalla richiesta SOAP
    let xml: string;
    let fileName = 'fattura.xml';
    
    if (isSOAPRequest(request)) {
      console.log('[SDI] Rilevata richiesta SOAP con MTOM');
      try {
        const extracted = await extractFileFromSOAPMTOM(request);
        xml = extracted.xml;
        fileName = extracted.fileName;
        console.log('[SDI] File estratto:', fileName);
        console.log('[SDI] Dimensione file:', extracted.fileContent.length, 'bytes');
      } catch (extractError: any) {
        console.error('[SDI] Errore estrazione file SOAP:', extractError);
        // Fallback: prova a leggere come testo normale
        xml = await request.text();
      }
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xml = await request.text();
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      xml = body.xml || body.content || '';
    } else {
      // Ultimo tentativo: leggi come testo
      xml = await request.text();
    }

    console.log('[SDI] XML ricevuto (primi 500 caratteri):', xml.substring(0, 500));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Determina se è una fattura o una notifica
    const isFattura = xml.includes('<FatturaElettronica') || xml.includes('<p:FatturaElettronica');
    const isNotifica = xml.includes('<Notifica') || xml.includes('<RicevutaConsegna') || 
                       xml.includes('<NotificaMancataConsegna') || xml.includes('<NotificaScarto') ||
                       xml.includes('<NotificaEsito') || xml.includes('<NotificaDecorrenzaTermini');

    if (isFattura) {
      // Gestione fattura ricevuta
      const parsedFattura = parseSDIXML(xml);

      // Esempio di salvataggio nel database
      const { data, error } = await supabase.from('invoices').insert({
        type: 'received',
        sdi_status: 'received',
        number: parsedFattura.numero || 'N/A',
        date: parsedFattura.data || new Date().toISOString().split('T')[0],
        customer_name: parsedFattura.partitaIva || 'N/A', // Placeholder
        meta: {
          sdi_xml: xml,
          sdi_parsed: parsedFattura,
          sdi_environment: 'PRODUCTION',
        },
      }).select('id').single();

      if (error) {
        console.error('[SDI] Errore salvataggio fattura:', error);
        return createSDIResponse({ success: false, error: 'Errore salvataggio fattura' }, 500);
      }

      console.log('[SDI] Fattura ricevuta e salvata:', data.id);
      
      // Registra evento
      await supabase.from('sdi_events').insert({
        invoice_id: data.id,
        event_type: 'FatturaRicevuta',
        payload: { xml_length: xml.length, sdi_environment: 'PRODUCTION' },
      });
      
      return createSDIResponse({ success: true, message: 'Fattura ricevuta e salvata con successo', invoice_id: data.id });
    } else if (isNotifica) {
      // Gestione notifica ricevuta
      const parsedNotification = parseSDINotification(xml);
      const { tipoNotifica, idSDI, identificativoSDI, esito } = parsedNotification;

      // Trova la fattura correlata
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, sdi_status, number')
        .or(`provider_ext_id.eq.${identificativoSDI},number.eq.${idSDI}`)
        .maybeSingle();

      if (invoiceError || !invoice) {
        console.warn('[SDI] Fattura non trovata per notifica:', { idSDI, identificativoSDI, tipoNotifica });
        // Registra comunque l'evento anche se la fattura non è trovata
        await supabase.from('sdi_events').insert({
          event_type: tipoNotifica || 'UNKNOWN_NOTIFICATION',
          payload: { xml, parsed: parsedNotification, sdi_environment: 'PRODUCTION' },
        });
        return createSDIResponse({ success: false, error: 'Fattura non trovata per notifica' }, 404);
      }

      let newStatus = invoice.sdi_status;
      let statusMessage = `Notifica ${tipoNotifica} ricevuta`;

      switch (tipoNotifica) {
        case 'RicevutaConsegna':
        case 'RC':
          newStatus = 'delivered';
          statusMessage = 'Fattura consegnata con successo';
          break;
        case 'NotificaMancataConsegna':
        case 'MC':
          newStatus = 'delivery_failed';
          statusMessage = 'Fattura non consegnata';
          break;
        case 'NotificaScarto':
        case 'NS':
          newStatus = 'rejected';
          statusMessage = 'Fattura scartata dal SDI';
          break;
        case 'NotificaEsito':
        case 'NE':
          newStatus = esito === 'ES01' ? 'accepted' : 'rejected';
          statusMessage = `Notifica esito: ${esito === 'ES01' ? 'Accettata' : 'Rifiutata'}`;
          break;
        case 'NotificaDecorrenzaTermini':
        case 'DT':
          newStatus = 'delivered_by_terms';
          statusMessage = 'Fattura accettata per decorrenza termini';
          break;
        default:
          statusMessage = `Notifica SDI sconosciuta: ${tipoNotifica}`;
          break;
      }

      // Registra evento
      await supabase.from('sdi_events').insert({
        invoice_id: invoice.id,
        event_type: tipoNotifica || 'UNKNOWN_NOTIFICATION',
        payload: { xml, parsed: parsedNotification, sdi_environment: 'PRODUCTION' },
      });

      // Aggiorna stato fattura
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          sdi_status: newStatus,
          meta: {
            ...invoice.meta,
            sdi_notification: parsedNotification,
            sdi_environment: 'PRODUCTION',
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('[SDI] Errore aggiornamento stato fattura:', updateError);
        return createSDIResponse({ success: false, error: 'Errore aggiornamento stato fattura' }, 500);
      }

      console.log('[SDI] Stato fattura aggiornato:', { invoice_id: invoice.id, newStatus, statusMessage });
      return createSDIResponse({ success: true, message: statusMessage, invoice_id: invoice.id, notification_id: identificativoSDI || idSDI });
    } else {
      // XML non riconosciuto
      console.warn('[SDI] XML non riconosciuto come fattura o notifica:', xml.substring(0, 200));
      return createSDIResponse({ success: false, error: 'XML non riconosciuto come fattura o notifica' }, 400);
    }
  } catch (error: any) {
    console.error('[SDI] Errore ricezione:', error);
    return createSDIResponse({ success: false, error: error.message }, 500);
  }
}

