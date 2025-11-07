// API endpoint unificato per ricezione fatture e notifiche dal SDI (ambiente TEST)
// Endpoint: POST /api/sdi/test/ricezione
//
// Questo endpoint riceve sia fatture elettroniche che notifiche dal SDI di test
// IMPORTANTE: Il SDI invia richieste SOAP con MTOM, quindi dobbiamo gestire multipart/related

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseSDIXML, parseSDINotification } from '../../_utils';
import { verifySDIRequest } from '@/lib/sdi/certificate-verification';
import { extractFileFromSOAPMTOM, createSOAPResponse, isSOAPRequest } from '@/lib/sdi/soap-reception';
import { saveSDIFile, saveSOAPEnvelope } from '@/lib/sdi/storage';
import { extractSOAPOperation, createMatchingSOAPResponse, SOAPOperation, getSOAPContentType } from '@/lib/sdi/soap-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Vercel max duration 30s

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
    
    // Header SSL da Nginx (mTLS)
    const sslClientVerify = request.headers.get('x-ssl-client-verify') || '';
    const sslClientDN = request.headers.get('x-ssl-client-dn') || '';
    
    // Logga raw headers
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    console.log('[SDI TEST] ========== RICEZIONE RICHIESTA ==========');
    console.log('[SDI TEST] Content-Type:', contentType);
    console.log('[SDI TEST] User-Agent:', userAgent);
    console.log('[SDI TEST] X-Forwarded-For:', forwardedFor);
    console.log('[SDI TEST] X-Real-IP:', realIp);
    console.log('[SDI TEST] X-SSL-Client-Verify:', sslClientVerify);
    console.log('[SDI TEST] X-SSL-Client-DN:', sslClientDN);
    console.log('[SDI TEST] URL:', request.url);
    console.log('[SDI TEST] ========== RAW HEADERS ==========');
    console.log(JSON.stringify(allHeaders, null, 2));
    
    // Logga se mTLS non è verificato (ma non rifiutare in test)
    if (sslClientVerify && sslClientVerify !== 'SUCCESS') {
      console.warn('[SDI TEST] ⚠️ mTLS non verificato:', sslClientVerify);
    }
    
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
    let fileContent: Buffer | null = null;
    let soapEnvelope: string | undefined;
    let rawSoapRequest: string = '';
    
    if (isSOAPRequest(request)) {
      console.log('[SDI TEST] Rilevata richiesta SOAP con MTOM');
      try {
        const extracted = await extractFileFromSOAPMTOM(request);
        xml = extracted.xml;
        fileName = extracted.fileName;
        fileContent = extracted.fileContent;
        soapEnvelope = extracted.soapEnvelope || '';
        rawSoapRequest = soapEnvelope;
        console.log('[SDI TEST] File estratto:', fileName);
        console.log('[SDI TEST] Dimensione file:', extracted.fileContent.length, 'bytes');
      } catch (extractError: any) {
        console.error('[SDI TEST] Errore estrazione file SOAP:', extractError);
        // Fallback: prova a leggere come testo normale
        xml = await request.text();
        soapEnvelope = xml;
        rawSoapRequest = xml;
        fileContent = Buffer.from(xml, 'utf8');
      }
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml') || contentType.includes('application/soap+xml')) {
      xml = await request.text();
      soapEnvelope = xml;
      rawSoapRequest = xml;
      fileContent = Buffer.from(xml, 'utf8');
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      xml = body.xml || body.content || '';
      soapEnvelope = xml;
      rawSoapRequest = xml;
      fileContent = Buffer.from(xml, 'utf8');
    } else {
      // Ultimo tentativo: leggi come testo
      xml = await request.text();
      soapEnvelope = xml;
      rawSoapRequest = xml;
      fileContent = Buffer.from(xml, 'utf8');
    }

    // Logga primi 4KB del SOAP envelope
    const soapPreview = rawSoapRequest.substring(0, 4096);
    console.log('[SDI TEST] ========== SOAP ENVELOPE (primi 4KB) ==========');
    console.log(soapPreview);
    console.log('[SDI TEST] ==============================================');
    
    // Estrai QName dell'operazione SOAP
    let soapOperation: SOAPOperation | null = null;
    if (soapEnvelope) {
      soapOperation = extractSOAPOperation(soapEnvelope);
      if (soapOperation) {
        console.log('[SDI TEST] ========== SOAP OPERATION ==========');
        console.log('[SDI TEST] LocalName:', soapOperation.localName);
        console.log('[SDI TEST] NamespaceURI:', soapOperation.namespaceURI);
        console.log('[SDI TEST] Prefix:', soapOperation.prefix);
        console.log('[SDI TEST] QName:', soapOperation.qname);
        console.log('[SDI TEST] SOAP NamespaceURI:', soapOperation.soapNamespaceURI);
        console.log('[SDI TEST] =====================================');
      } else {
        console.warn('[SDI TEST] ⚠️ Operazione SOAP non estratta');
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let responseContentType = getSOAPContentType(soapOperation?.soapNamespaceURI);

    // Determina se è una fattura o una notifica
    const isFattura = xml.includes('<FatturaElettronica') || xml.includes('<p:FatturaElettronica');
    const isNotifica = xml.includes('<Notifica') || xml.includes('<RicevutaConsegna') || 
                       xml.includes('<NotificaMancataConsegna') || xml.includes('<NotificaScarto') ||
                       xml.includes('<NotificaEsito') || xml.includes('<NotificaDecorrenzaTermini');

    if (isFattura) {
      // Gestione fattura ricevuta
      const parsedFattura = parseSDIXML(xml);

      // Salva file su Supabase Storage
      let fileUrl = '';
      let filePath = '';
      let soapUrl = '';
      let soapPath = '';
      
      try {
        if (fileContent) {
          const fileResult = await saveSDIFile(fileName, fileContent, 'TEST');
          fileUrl = fileResult.url;
          filePath = fileResult.path;
          console.log('[SDI TEST] File salvato su storage:', fileUrl);
        }
        
        if (soapEnvelope) {
          const soapResult = await saveSOAPEnvelope(soapEnvelope, fileName, 'TEST');
          soapUrl = soapResult.url;
          soapPath = soapResult.path;
          console.log('[SDI TEST] SOAP envelope salvato su storage:', soapUrl);
        }
      } catch (storageError: any) {
        console.error('[SDI TEST] Errore salvataggio su storage:', storageError);
        // Continua comunque, non bloccare la ricezione
      }

      // Salvataggio nel database
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
          file_url: fileUrl,
          file_path: filePath,
          soap_url: soapUrl,
          soap_path: soapPath,
        },
      }).select('id').single();

      if (error) {
        console.error('[SDI TEST] Errore salvataggio fattura:', error);
        // Genera risposta SOAP che matcha l'operazione in ingresso
        let soapResponse: string;
        if (soapOperation) {
          const matching = createMatchingSOAPResponse(soapOperation, 'KO');
          soapResponse = matching.xml;
          responseContentType = matching.contentType;
          console.log('[SDI TEST] Risposta SOAP generata (errore matching):', soapResponse);
        } else {
          soapResponse = createSOAPResponse('KO', `Errore salvataggio fattura: ${error.message}`);
          responseContentType = getSOAPContentType();
          console.log('[SDI TEST] Risposta SOAP generata (fallback errore):', soapResponse);
        }
        
        // Registra evento anche per errore
        await supabase.from('sdi_events').insert({
          event_type: 'ErroreSalvataggioFattura',
          payload: {
            error: error.message,
            sdi_environment: 'TEST',
            headers: allHeaders,
            ssl_client_verify: sslClientVerify,
            ssl_client_dn: sslClientDN,
            raw_soap_request: rawSoapRequest.substring(0, 4096),
            soap_operation_qname: soapOperation ? soapOperation.qname : null,
            soap_operation_localname: soapOperation ? soapOperation.localName : null,
            soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
            soap_response_returned: soapResponse.substring(0, 4096),
          },
        });
        
        // Rispondi comunque con SOAP OK per non bloccare il SDI
        return new NextResponse(soapResponse, {
          status: 200,
          headers: {
            'Content-Type': responseContentType,
          },
        });
      }

      console.log('[SDI TEST] ✅ Fattura ricevuta e salvata:', data.id);
      
      // Genera risposta SOAP che matcha l'operazione in ingresso
      let soapResponse: string;
      if (soapOperation) {
        const matching = createMatchingSOAPResponse(soapOperation, 'OK');
        soapResponse = matching.xml;
        responseContentType = matching.contentType;
        console.log('[SDI TEST] Risposta SOAP generata (matching):', soapResponse);
      } else {
        // Fallback: usa risposta standard
        soapResponse = createSOAPResponse('OK', 'Fattura ricevuta e salvata con successo');
        responseContentType = getSOAPContentType();
        console.log('[SDI TEST] Risposta SOAP generata (fallback):', soapResponse.substring(0, 500));
      }
      
      // Estrai identificativoSdI se presente
      const identificativoSdI = parsedFattura.identificativoSdI || parsedFattura.idSDI || '';
      
      // Registra evento completo con tutti i campi richiesti
      await supabase.from('sdi_events').insert({
        invoice_id: data.id,
        event_type: 'FatturaRicevuta',
        payload: { 
          xml_length: xml.length, 
          sdi_environment: 'TEST',
          fileName,
          contentType,
          file_url: fileUrl,
          file_path: filePath,
          soap_url: soapUrl,
          soap_path: soapPath,
          headers: allHeaders,
          ssl_client_verify: sslClientVerify,
          ssl_client_dn: sslClientDN,
          raw_soap_request: rawSoapRequest.substring(0, 4096), // Primi 4KB
          soap_operation_qname: soapOperation ? soapOperation.qname : null,
          soap_operation_localname: soapOperation ? soapOperation.localName : null,
          soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
          soap_response_returned: soapResponse.substring(0, 4096), // Primi 4KB
          identificativoSdI: identificativoSdI,
        },
      });
      
      // IMPORTANTE: Rispondi sempre con SOAP XML per il SDI
      // Content-Type: application/soap+xml; charset=utf-8
      return new NextResponse(soapResponse, {
        status: 200,
        headers: {
          'Content-Type': responseContentType,
        },
      });
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
          payload: { 
            xml, 
            parsed: parsedNotification, 
            sdi_environment: 'TEST',
            headers: allHeaders,
            ssl_client_verify: sslClientVerify,
            ssl_client_dn: sslClientDN,
            raw_soap: soapEnvelope?.substring(0, 1000),
          },
        });
        // Genera risposta SOAP che matcha l'operazione in ingresso
        let soapResponse: string;
        if (soapOperation) {
          const matching = createMatchingSOAPResponse(soapOperation, 'OK');
          soapResponse = matching.xml;
          responseContentType = matching.contentType;
          console.log('[SDI TEST] Risposta SOAP generata (notifica senza fattura):', soapResponse);
        } else {
          soapResponse = createSOAPResponse('OK', `Notifica ricevuta (fattura non trovata)`, identificativoSDI || idSDI);
          responseContentType = getSOAPContentType();
          console.log('[SDI TEST] Risposta SOAP generata (fallback notifica senza fattura):', soapResponse);
        }
        
        // Registra anche qui con tutti i campi
        await supabase.from('sdi_events').insert({
          event_type: tipoNotifica || 'UNKNOWN_NOTIFICATION',
          payload: { 
            xml, 
            parsed: parsedNotification, 
            sdi_environment: 'TEST',
            headers: allHeaders,
            ssl_client_verify: sslClientVerify,
            ssl_client_dn: sslClientDN,
            raw_soap_request: rawSoapRequest.substring(0, 4096),
            soap_operation_qname: soapOperation ? soapOperation.qname : null,
            soap_operation_localname: soapOperation ? soapOperation.localName : null,
            soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
            soap_response_returned: soapResponse.substring(0, 4096),
            identificativoSdI: identificativoSDI || idSDI || '',
          },
        });
        
        return new NextResponse(soapResponse, {
          status: 200,
          headers: {
            'Content-Type': responseContentType,
          },
        });
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

      // Salva notifica su storage (opzionale)
      let fileUrl = '';
      let filePath = '';
      let soapUrl = '';
      let soapPath = '';
      
      try {
        if (fileContent) {
          const fileResult = await saveSDIFile(`notifica-${tipoNotifica}-${fileName}`, fileContent, 'TEST');
          fileUrl = fileResult.url;
          filePath = fileResult.path;
        }
        if (soapEnvelope) {
          const soapResult = await saveSOAPEnvelope(soapEnvelope, `notifica-${tipoNotifica}-${fileName}`, 'TEST');
          soapUrl = soapResult.url;
          soapPath = soapResult.path;
        }
      } catch (storageError: any) {
        console.error('[SDI TEST] Errore salvataggio notifica su storage:', storageError);
        // Continua comunque
      }

      // Aggiorna stato fattura
      const invoiceMeta = (invoice as any).meta || {};
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          sdi_status: newStatus,
          meta: {
            ...invoiceMeta,
            sdi_notification: parsedNotification,
            sdi_environment: 'TEST',
            updated_at: new Date().toISOString(),
            notification_file_url: fileUrl,
            notification_soap_url: soapUrl,
          },
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('[SDI TEST] Errore aggiornamento stato fattura:', updateError);
        // Genera risposta SOAP che matcha l'operazione in ingresso
        let soapResponse: string;
        if (soapOperation) {
          const matching = createMatchingSOAPResponse(soapOperation, 'KO');
          soapResponse = matching.xml;
          responseContentType = matching.contentType;
          console.log('[SDI TEST] Risposta SOAP generata (errore aggiornamento):', soapResponse);
        } else {
          soapResponse = createSOAPResponse('KO', `Errore aggiornamento stato fattura: ${updateError.message}`, identificativoSDI || idSDI);
          responseContentType = getSOAPContentType();
          console.log('[SDI TEST] Risposta SOAP generata (fallback errore aggiornamento):', soapResponse);
        }
        
        // Registra evento anche per errore
        await supabase.from('sdi_events').insert({
          invoice_id: invoice.id,
          event_type: 'ErroreAggiornamentoStato',
          payload: {
            error: updateError.message,
            sdi_environment: 'TEST',
            headers: allHeaders,
            ssl_client_verify: sslClientVerify,
            ssl_client_dn: sslClientDN,
            raw_soap_request: rawSoapRequest.substring(0, 4096),
            soap_operation_qname: soapOperation ? soapOperation.qname : null,
            soap_operation_localname: soapOperation ? soapOperation.localName : null,
            soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
            soap_response_returned: soapResponse.substring(0, 4096),
            identificativoSdI: identificativoSDI || idSDI || '',
          },
        });
        
        return new NextResponse(soapResponse, {
          status: 200,
          headers: {
            'Content-Type': responseContentType,
          },
        });
      }

      console.log('[SDI TEST] ✅ Stato fattura aggiornato:', { invoice_id: invoice.id, newStatus, statusMessage });
      
      // Genera risposta SOAP che matcha l'operazione in ingresso
      let soapResponse: string;
      if (soapOperation) {
        const matching = createMatchingSOAPResponse(soapOperation, 'OK');
        soapResponse = matching.xml;
        responseContentType = matching.contentType;
        console.log('[SDI TEST] Risposta SOAP generata (notifica):', soapResponse);
      } else {
        soapResponse = createSOAPResponse('OK', statusMessage, identificativoSDI || idSDI);
        responseContentType = getSOAPContentType();
        console.log('[SDI TEST] Risposta SOAP generata (fallback notifica):', soapResponse);
      }
      
      // Registra evento completo con tutti i campi richiesti
      await supabase.from('sdi_events').insert({
        invoice_id: invoice.id,
        event_type: tipoNotifica || 'UNKNOWN_NOTIFICATION',
        payload: { 
          xml, 
          parsed: parsedNotification, 
          sdi_environment: 'TEST',
          fileName,
          contentType,
          file_url: fileUrl,
          file_path: filePath,
          soap_url: soapUrl,
          soap_path: soapPath,
          headers: allHeaders,
          ssl_client_verify: sslClientVerify,
          ssl_client_dn: sslClientDN,
          raw_soap_request: rawSoapRequest.substring(0, 4096),
          soap_operation_qname: soapOperation ? soapOperation.qname : null,
          soap_operation_localname: soapOperation ? soapOperation.localName : null,
          soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
          soap_response_returned: soapResponse.substring(0, 4096),
          identificativoSdI: identificativoSDI || idSDI || '',
        },
      });
      
      // IMPORTANTE: Rispondi sempre con SOAP XML per il SDI
      return new NextResponse(soapResponse, {
        status: 200,
        headers: {
          'Content-Type': responseContentType,
        },
      });
    } else {
      // XML non riconosciuto
      console.warn('[SDI TEST] ⚠️ XML non riconosciuto come fattura o notifica');
      console.warn('[SDI TEST] XML ricevuto (primi 500 caratteri):', xml.substring(0, 500));
      
      // Genera risposta SOAP che matcha l'operazione in ingresso (se disponibile)
      let soapResponse: string;
      if (soapOperation) {
        const matching = createMatchingSOAPResponse(soapOperation, 'KO');
        soapResponse = matching.xml;
        responseContentType = matching.contentType;
        console.log('[SDI TEST] Risposta SOAP generata (XML non riconosciuto):', soapResponse);
      } else {
        soapResponse = createSOAPResponse('KO', 'XML non riconosciuto come fattura o notifica');
        responseContentType = getSOAPContentType();
        console.log('[SDI TEST] Risposta SOAP generata (fallback XML non riconosciuto):', soapResponse);
      }
      
      // Registra evento anche per XML non riconosciuto
      await supabase.from('sdi_events').insert({
        event_type: 'XML_NON_RICONOSCIUTO',
        payload: {
          xml,
          sdi_environment: 'TEST',
          headers: allHeaders,
          ssl_client_verify: sslClientVerify,
          ssl_client_dn: sslClientDN,
          raw_soap_request: rawSoapRequest.substring(0, 4096),
          soap_operation_qname: soapOperation ? soapOperation.qname : null,
          soap_operation_localname: soapOperation ? soapOperation.localName : null,
          soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
          soap_response_returned: soapResponse.substring(0, 4096),
        },
      });
      
      // IMPORTANTE: Rispondi sempre con SOAP XML per il SDI (anche per errori)
      return new NextResponse(soapResponse, {
        status: 200, // SDI si aspetta 200 anche per errori (l'errore è nel SOAP)
        headers: {
          'Content-Type': responseContentType,
        },
      });
    }
  } catch (error: any) {
    console.error('[SDI TEST] ❌ Errore ricezione:', error);
    console.error('[SDI TEST] Stack:', error.stack);
    
    // Rispondi con SOAP anche per errori critici
    const soapResponse = createSOAPResponse('KO', `Errore interno: ${error.message}`);
    return new NextResponse(soapResponse, {
      status: 200, // SDI si aspetta 200 anche per errori
      headers: {
        'Content-Type': getSOAPContentType(),
      },
    });
  }
}

