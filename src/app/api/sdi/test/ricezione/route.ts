// API endpoint unificato per ricezione fatture e notifiche dal SDI (ambiente TEST)
// Endpoint: POST /api/sdi/test/ricezione
//
// Questo endpoint riceve sia fatture elettroniche che notifiche dal SDI di test
// IMPORTANTE: Il SDI invia richieste SOAP con MTOM, quindi dobbiamo gestire multipart/related

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSDIResponse, parseSDIXML, parseSDINotification } from '../../_utils';
import { verifySDIRequest } from '@/lib/sdi/certificate-verification';
import { extractFileFromSOAPMTOM, createSOAPResponse, isSOAPRequest } from '@/lib/sdi/soap-reception';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gestisce richieste OPTIONS per CORS
export async function OPTIONS() {
  console.log('[SDI TEST] ⚠️ OPTIONS chiamato');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Aggiungi GET per test di raggiungibilità
export async function GET(request: NextRequest) {
  console.log('[SDI TEST] ⚠️ GET chiamato - endpoint raggiungibile');
  return NextResponse.json({
    success: true,
    message: 'Endpoint SDI ricezione raggiungibile',
    endpoint: '/api/sdi/test/ricezione',
    method: 'POST',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  // FORZA LOG IMMEDIATO all'inizio della funzione per verificare che sia chiamata
  console.log('========================================');
  console.log('[SDI TEST] ⚠️⚠️⚠️ POST RICEZIONE CHIAMATO ⚠️⚠️⚠️');
  console.log('[SDI TEST] Timestamp:', new Date().toISOString());
  console.log('[SDI TEST] URL:', request.url);
  console.log('[SDI TEST] Method:', request.method);
  console.log('========================================');
  
  try {
    // Log dettagliato per debug
    const contentType = request.headers.get('content-type') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const realIp = request.headers.get('x-real-ip') || '';
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    console.log('[SDI TEST] ========== RICEZIONE RICHIESTA ==========');
    console.log('[SDI TEST] Content-Type:', contentType);
    console.log('[SDI TEST] User-Agent:', userAgent);
    console.log('[SDI TEST] X-Forwarded-For:', forwardedFor);
    console.log('[SDI TEST] X-Real-IP:', realIp);
    console.log('[SDI TEST] URL:', request.url);
    console.log('[SDI TEST] Tutti gli header:', JSON.stringify(allHeaders, null, 2));
    
    // Verifica che la richiesta provenga da SDI (test)
    // NOTA: In produzione, configurare verifica completa (IP whitelist, certificati)
    if (!verifySDIRequest(request, 'test')) {
      console.warn('[SDI TEST] Richiesta non autorizzata da SDI');
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
      console.log('[SDI TEST] Rilevata richiesta SOAP con MTOM');
      try {
        const extracted = await extractFileFromSOAPMTOM(request);
        xml = extracted.xml;
        fileName = extracted.fileName;
        console.log('[SDI TEST] File estratto:', fileName);
        console.log('[SDI TEST] Dimensione file:', extracted.fileContent.length, 'bytes');
      } catch (extractError: any) {
        console.error('[SDI TEST] Errore estrazione file SOAP:', extractError);
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

    console.log('[SDI TEST] XML ricevuto (primi 500 caratteri):', xml.substring(0, 500));

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
          sdi_environment: 'TEST',
        },
      }).select('id').single();

      if (error) {
        console.error('[SDI TEST] Errore salvataggio fattura:', error);
        return createSDIResponse({ success: false, error: 'Errore salvataggio fattura' }, 500);
      }

      console.log('[SDI TEST] ✅ Fattura ricevuta e salvata:', data.id);
      
      // Registra evento
      await supabase.from('sdi_events').insert({
        invoice_id: data.id,
        event_type: 'FatturaRicevuta',
        payload: { 
          xml_length: xml.length, 
          sdi_environment: 'TEST',
          fileName,
          contentType,
        },
      });
      
      // IMPORTANTE: Rispondi con SOAP XML invece di JSON
      // Il SDI si aspetta una risposta SOAP con Esito OK
      if (isSOAPRequest(request)) {
        const soapResponse = createSOAPResponse('OK', 'Fattura ricevuta e salvata con successo');
        return new NextResponse(soapResponse, {
          status: 200,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
          },
        });
      }
      
      // Fallback: rispondi con JSON se non è SOAP
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
        console.warn('[SDI TEST] Fattura non trovata per notifica:', { idSDI, identificativoSDI, tipoNotifica });
        // Registra comunque l'evento anche se la fattura non è trovata
        await supabase.from('sdi_events').insert({
          event_type: tipoNotifica || 'UNKNOWN_NOTIFICATION',
          payload: { xml, parsed: parsedNotification, sdi_environment: 'TEST' },
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
        payload: { xml, parsed: parsedNotification, sdi_environment: 'TEST' },
      });

      // Aggiorna stato fattura
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          sdi_status: newStatus,
          meta: {
            ...invoice.meta,
            sdi_notification: parsedNotification,
            sdi_environment: 'TEST',
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('[SDI TEST] Errore aggiornamento stato fattura:', updateError);
        return createSDIResponse({ success: false, error: 'Errore aggiornamento stato fattura' }, 500);
      }

      console.log('[SDI TEST] ✅ Stato fattura aggiornato:', { invoice_id: invoice.id, newStatus, statusMessage });
      
      // IMPORTANTE: Rispondi con SOAP XML invece di JSON
      // Il SDI si aspetta una risposta SOAP con Esito OK
      if (isSOAPRequest(request)) {
        const soapResponse = createSOAPResponse('OK', statusMessage, identificativoSDI || idSDI);
        return new NextResponse(soapResponse, {
          status: 200,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
          },
        });
      }
      
      // Fallback: rispondi con JSON se non è SOAP
      return createSDIResponse({ success: true, message: statusMessage, invoice_id: invoice.id, notification_id: identificativoSDI || idSDI });
    } else {
      // XML non riconosciuto
      console.warn('[SDI TEST] ⚠️ XML non riconosciuto come fattura o notifica');
      console.warn('[SDI TEST] XML ricevuto (primi 500 caratteri):', xml.substring(0, 500));
      
      // Rispondi con SOAP anche per errori
      if (isSOAPRequest(request)) {
        const soapResponse = createSOAPResponse('KO', 'XML non riconosciuto come fattura o notifica');
        return new NextResponse(soapResponse, {
          status: 200, // SDI si aspetta 200 anche per errori (l'errore è nel SOAP)
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
          },
        });
      }
      
      return createSDIResponse({ success: false, error: 'XML non riconosciuto come fattura o notifica' }, 400);
    }
  } catch (error: any) {
    console.error('[SDI TEST] ❌ Errore ricezione:', error);
    console.error('[SDI TEST] Stack:', error.stack);
    
    // Rispondi con SOAP anche per errori critici
    const contentType = request.headers.get('content-type') || '';
    if (isSOAPRequest(request)) {
      const soapResponse = createSOAPResponse('KO', `Errore interno: ${error.message}`);
      return new NextResponse(soapResponse, {
        status: 200, // SDI si aspetta 200 anche per errori
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
      });
    }
    
    return createSDIResponse({ success: false, error: error.message }, 500);
  }
}

