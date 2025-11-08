// API SDI TEST – ricezione fatture e notifiche (allineata al manuale SDI)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseSDIXML, parseSDINotification, resolveNotificationStatus } from '../../_utils';
import { verifySDIRequest } from '@/lib/sdi/certificate-verification';
import { extractFileFromSOAPMTOM, extractFileSdIConMetadati, isSOAPRequest } from '@/lib/sdi/soap-reception';
import { saveSDIFile, saveSOAPEnvelope } from '@/lib/sdi/storage';
import { extractSOAPOperation, sanitizeSOAPEnvelope, SOAPOperation } from '@/lib/sdi/soap-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '20mb',
  },
};

const XML_OK_RESPONSE = '<?xml version="1.0" encoding="UTF-8"?><Esito>OK</Esito>';
const XML_CONTENT_TYPE = 'application/xml; charset=utf-8';

const SOAP_1_2_NAMESPACE = 'http://www.w3.org/2003/05/soap-envelope';
const SOAP_1_1_NAMESPACE = 'http://schemas.xmlsoap.org/soap/envelope/';
const SOAP_OK_CONTENT_TYPE = 'application/soap+xml; charset=utf-8';

function buildSOAPOkResponse() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${SOAP_1_2_NAMESPACE}">
  <soap:Body>
    <EsitoCommittente xmlns="http://www.fatturapa.gov.it/sdi/messaggi/v1.0">
      <Esito>OK</Esito>
    </EsitoCommittente>
  </soap:Body>
</soap:Envelope>`;

  return { xml, contentType: SOAP_OK_CONTENT_TYPE };
}

function detectSoapNamespace(operation: SOAPOperation | null, envelope: string) {
  if (operation?.soapNamespaceURI) return operation.soapNamespaceURI;
  if (envelope.includes(SOAP_1_1_NAMESPACE)) return SOAP_1_1_NAMESPACE;
  if (envelope.includes(SOAP_1_2_NAMESPACE)) return SOAP_1_2_NAMESPACE;
  return SOAP_1_2_NAMESPACE;
}

function logSupabaseError(context: string, error: any) {
  if (!error) return;
  console.error(`[SDI TEST] Errore Supabase (${context}):`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

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

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint SDI TEST attivo',
    method: 'POST',
  });
}

export async function POST(request: NextRequest) {
  console.log('========================================');
  console.log('[SDI TEST] POST /api/sdi/test/ricezione');
  console.log('[SDI TEST] Timestamp:', new Date().toISOString());
  console.log('[SDI TEST] URL:', request.url);
  console.log('========================================');

  const contentType = request.headers.get('content-type') || '';
  const sslClientVerify = request.headers.get('x-ssl-client-verify') || '';
  const sslClientDN = request.headers.get('x-ssl-client-dn') || '';

  console.log('[SDI TEST] Content-Type:', contentType);
  console.log('[SDI TEST] X-SSL-Client-Verify:', sslClientVerify);
  console.log('[SDI TEST] X-SSL-Client-DN:', sslClientDN);

  const allHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });
  console.log('[SDI TEST] Headers:', JSON.stringify(allHeaders, null, 2));

  // Non blocchiamo in test, ma registriamo il risultato
  const verified = verifySDIRequest(request, 'test');
  if (!verified) {
    console.warn('[SDI TEST] Verifica SDI non riuscita (test: nessun blocco)');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const isSoapEnvelope = isSOAPRequest(request);
  let soapEnvelope = '';
  let xml = '';
  let fileName = 'sdi-payload.xml';
  let fileContent: Buffer | null = null;
  let soapOperation: SOAPOperation | null = null;
  let fileSdIMetadata: Record<string, any> | null = null;
  let soapResponse = buildSOAPOkResponse();

  try {
    if (isSoapEnvelope) {
      console.log('[SDI TEST] Richiesta SOAP con MTOM');
      try {
        const extracted = await extractFileFromSOAPMTOM(request);
        soapEnvelope = extracted.soapEnvelope || '';
        xml = extracted.xml;
        fileName = extracted.fileName;
        fileContent = extracted.fileContent;
        console.log('[SDI TEST] File estratto:', fileName, 'size:', fileContent ? fileContent.length : 0, 'bytes');
        soapEnvelope = sanitizeSOAPEnvelope(soapEnvelope);
        xml = sanitizeSOAPEnvelope(xml);
      } catch (extractError) {
        console.error('[SDI TEST] Errore estrazione MTOM:', extractError);
        xml = await request.text();
        soapEnvelope = sanitizeSOAPEnvelope(xml);
        xml = soapEnvelope;
        fileContent = Buffer.from(soapEnvelope, 'utf8');
      }

      soapEnvelope = sanitizeSOAPEnvelope(soapEnvelope);
      xml = sanitizeSOAPEnvelope(xml);

      const soapPreview = soapEnvelope.substring(0, 4096);
      console.log('[SDI TEST] SOAP preview (4KB):', soapPreview);

      soapOperation = extractSOAPOperation(soapEnvelope);
      if (soapOperation) {
        console.log('[SDI TEST] Operazione SOAP:', soapOperation);
      } else {
        console.log('[SDI TEST] Operazione SOAP non rilevata');
      }

      if (soapEnvelope) {
        const fileSdIExtraction = extractFileSdIConMetadati(soapEnvelope);
        if (fileSdIExtraction) {
          console.log('[SDI TEST] Riconosciuto payload fileSdIConMetadati');
          fileName = fileSdIExtraction.fileName || fileName;
          fileContent = fileSdIExtraction.fileContent || fileContent;
          if (fileSdIExtraction.xml && fileSdIExtraction.xml.trim()) {
            xml = sanitizeSOAPEnvelope(fileSdIExtraction.xml);
          }
          fileSdIMetadata = {
            ...(fileSdIMetadata || {}),
            ...fileSdIExtraction.metadata,
          };
          if (fileSdIExtraction.metadataXml) {
            fileSdIMetadata.metadataXml = fileSdIExtraction.metadataXml;
          }
        }
      }

      const detectedNamespace = detectSoapNamespace(soapOperation, soapEnvelope);
      soapResponse = buildSOAPOkResponse();
      console.log('[SDI TEST] SOAP namespace rilevato:', detectedNamespace);
      console.log('[SDI TEST] SOAP namespace risposta forzato:', SOAP_1_2_NAMESPACE, 'Content-Type:', soapResponse.contentType);
    } else {
      xml = await request.text();
      xml = sanitizeSOAPEnvelope(xml);
      console.log('[SDI TEST] XML (prima di 2KB):', xml.substring(0, 2048));
    }

    let isFattura = xml.includes('<FatturaElettronica') || xml.includes('<p:FatturaElettronica');
    let isNotifica = xml.includes('<Notifica') ||
      xml.includes('<RicevutaConsegna') ||
      xml.includes('<NotificaMancataConsegna') ||
      xml.includes('<NotificaScarto') ||
      xml.includes('<NotificaEsito') ||
      xml.includes('<NotificaDecorrenzaTermini') ||
      xml.includes('<EsitoCommittente>');

    if (isSoapEnvelope) {
      // === Gestione SOAP (fatture + eventuali notifiche SOAP) ===
      const environment = 'TEST';
      let fileUrl = '';
      let filePath = '';
      let soapUrl = '';
      let soapPath = '';

      try {
        if (fileContent) {
          const storedFile = await saveSDIFile(fileName, fileContent, environment);
          fileUrl = storedFile.url;
          filePath = storedFile.path;
        }
        if (soapEnvelope) {
          const storedSoap = await saveSOAPEnvelope(soapEnvelope, fileName, environment);
          soapUrl = storedSoap.url;
          soapPath = storedSoap.path;
        }
      } catch (storageError) {
        console.error('[SDI TEST] Errore salvataggio storage:', storageError);
      }

      if (isFattura) {
        const fattura = parseSDIXML(xml);
        const { data, error } = await supabase
          .from('invoices')
          .insert({
            org_id: '1ea3be12-a439-46ac-94d9-eaff1bb346c2',
            provider_id: 'sdi_test',
            sdi_status: 'received',
            number: fattura.numero || 'N/A',
            date: fattura.data || new Date().toISOString().split('T')[0],
            customer_name: fattura.partitaIva || 'N/A',
            meta: {
              sdi_xml: xml,
              sdi_parsed: fattura,
              sdi_environment: environment,
              file_url: fileUrl,
              file_path: filePath,
              soap_url: soapUrl,
              soap_path: soapPath,
              soap_operation: soapOperation,
              file_sdi_metadata: fileSdIMetadata,
            },
          })
          .select('id')
          .single();

        const insertedInvoiceId = data?.id ?? null;

        if (error || !data) {
          logSupabaseError('insert invoice', error);
          await supabase.from('sdi_events').insert({
            provider_id: 'sdi_test',
            invoice_id: insertedInvoiceId,
            event_type: 'ErroreSalvataggioFattura',
            payload: {
              error: error?.message,
              xml_length: xml.length,
              headers: allHeaders,
              ssl_client_verify: sslClientVerify,
              ssl_client_dn: sslClientDN,
              raw_soap_request: soapEnvelope.substring(0, 4096),
              soap_operation: soapOperation,
              soap_response_returned: soapResponse.xml.substring(0, 4096),
              file_sdi_metadata: fileSdIMetadata,
            },
          });
        } else {
          const { error: insertEventError } = await supabase.from('sdi_events').insert({
            provider_id: 'sdi_test',
            invoice_id: data.id,
            event_type: 'FatturaRicevuta',
            payload: {
              xml_length: xml.length,
              sdi_environment: environment,
              fileName,
              contentType,
              file_url: fileUrl,
              file_path: filePath,
              soap_url: soapUrl,
              soap_path: soapPath,
              headers: allHeaders,
              ssl_client_verify: sslClientVerify,
              ssl_client_dn: sslClientDN,
              raw_soap_request: soapEnvelope.substring(0, 4096),
              soap_operation: soapOperation,
              soap_response_returned: soapResponse.xml.substring(0, 4096),
              identificativoSdI: fattura.identificativoSdI || fattura.idSDI || '',
              file_sdi_metadata: fileSdIMetadata,
            },
          });
          logSupabaseError('insert event FatturaRicevuta', insertEventError);
        }
      } else if (isNotifica) {
        const notifica = parseSDINotification(xml);
        const { identificativoSDI, idSDI, tipoNotifica } = notifica;
        const resolution = resolveNotificationStatus(notifica, soapOperation?.localName);
        const nowIso = new Date().toISOString();

        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, sdi_status, meta')
          .or(`provider_ext_id.eq.${identificativoSDI},number.eq.${idSDI}`)
          .maybeSingle();

        let invoiceId: string | null = null;
        if (invoice) {
          invoiceId = invoice.id;
          const invoiceMeta = (invoice as any).meta || {};
          const statusHistory = Array.isArray(invoiceMeta.sdi_status_history)
            ? [...invoiceMeta.sdi_status_history]
            : [];
          statusHistory.push({
            timestamp: nowIso,
            status: resolution.status || invoice.sdi_status,
            message: resolution.statusMessage,
            tipoNotifica: resolution.normalizedType,
          });

          const updatePayload: Record<string, any> = {
            meta: {
              ...invoiceMeta,
              sdi_notification: notifica,
              sdi_environment: environment,
              notification_file_url: fileUrl,
              notification_soap_url: soapUrl,
              updated_at: nowIso,
              sdi_status_history: statusHistory,
            },
          };

          if (resolution.status) {
            updatePayload.sdi_status = resolution.status;
          }

          const { error: updateError } = await supabase
            .from('invoices')
            .update(updatePayload)
            .eq('id', invoice.id);

          if (updateError) {
            console.error('[SDI TEST] Errore aggiornamento stato fattura:', updateError);
          }
        }

        try {
          await supabase.from('sdi_messages').insert({
            provider_id: 'sdi_test',
            environment,
            invoice_id: invoiceId,
            sdi_identifier: identificativoSDI || idSDI || null,
            message_type: resolution.normalizedType,
            status: resolution.status || null,
            status_message: resolution.statusMessage,
            payload: {
              xml,
              parsed: notifica,
              headers: allHeaders,
              soap_operation: soapOperation,
              resolution,
              message_id: notifica.messageId || null,
              pec_message_id: notifica.pecMessageId || null,
            },
          });
        } catch (messageError) {
          console.error('[SDI TEST] Errore salvataggio sdi_messages:', messageError);
        }

        const { error: eventNotificaError } = await supabase.from('sdi_events').insert({
          provider_id: 'sdi_test',
          invoice_id: invoiceId,
          event_type: tipoNotifica || 'UNKNOWN_NOTIFICATION',
          payload: {
            xml,
            parsed: notifica,
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
            raw_soap_request: soapEnvelope.substring(0, 4096),
            soap_operation_qname: soapOperation ? soapOperation.qname : null,
            soap_operation_localname: soapOperation ? soapOperation.localName : null,
            soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
            soap_response_returned: soapResponse.xml.substring(0, 4096),
            identificativoSdI: identificativoSDI || idSDI || '',
            file_sdi_metadata: fileSdIMetadata,
            message_id: notifica.messageId || null,
            pec_message_id: notifica.pecMessageId || null,
          },
        });
        logSupabaseError('insert event notifica con fattura', eventNotificaError);

      } else {
        console.warn('[SDI TEST] XML SOAP non riconosciuto come fattura/notifica');
        const rawSoapRequest = soapEnvelope.substring(0, 4096);
        const soapOperation = extractSOAPOperation(soapEnvelope);
        console.log('[SDI TEST] Inserimento evento XML_SOAP_NON_RICONOSCIUTO in corso');
        const { data: eventUnknownData, error: eventUnknownError } = await supabase
          .from('sdi_events')
          .insert({
          provider_id: 'sdi_test',
          event_type: 'XML_SOAP_NON_RICONOSCIUTO',
          payload: {
            xml,
            sdi_environment: 'TEST',
            headers: allHeaders,
            ssl_client_verify: sslClientVerify,
            ssl_client_dn: sslClientDN,
            raw_soap_request: rawSoapRequest,
            soap_operation_qname: soapOperation ? soapOperation.qname : null,
            soap_operation_localname: soapOperation ? soapOperation.localName : null,
            soap_operation_namespace: soapOperation ? soapOperation.namespaceURI : null,
            soap_response_returned: soapResponse.xml.substring(0, 4096),
            file_sdi_metadata: fileSdIMetadata,
          },
          })
          .select('id')
          .single();
        if (eventUnknownData) {
          console.log('[SDI TEST] Evento XML_SOAP_NON_RICONOSCIUTO creato con id:', eventUnknownData.id);
        }
        logSupabaseError('insert event XML_NON_RICONOSCIUTO', eventUnknownError);
      }

      return new NextResponse(soapResponse.xml, {
        status: 200,
        headers: {
          'Content-Type': soapResponse.contentType,
        },
      });
    }

    // === Gestione XML semplice (notifiche dirette) ===
    const notifica = parseSDINotification(xml);
    const { identificativoSDI, idSDI, tipoNotifica } = notifica;
    const resolution = resolveNotificationStatus(notifica);
    const nowIso = new Date().toISOString();

    let invoiceId: string | null = null;
    if (identificativoSDI || idSDI) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, sdi_status, meta')
        .or(`provider_ext_id.eq.${identificativoSDI},number.eq.${idSDI}`)
        .maybeSingle();

      if (invoice) {
        invoiceId = invoice.id;
        const invoiceMeta = (invoice as any).meta || {};
        const statusHistory = Array.isArray(invoiceMeta.sdi_status_history)
          ? [...invoiceMeta.sdi_status_history]
          : [];
        statusHistory.push({
          timestamp: nowIso,
          status: resolution.status || invoice.sdi_status,
          message: resolution.statusMessage,
          tipoNotifica: resolution.normalizedType,
        });

        const updatePayload: Record<string, any> = {
          meta: {
            ...invoiceMeta,
            sdi_notification: notifica,
            sdi_environment: 'TEST',
            updated_at: nowIso,
            sdi_status_history: statusHistory,
          },
        };

        if (resolution.status) {
          updatePayload.sdi_status = resolution.status;
        }

        const { error: updateError } = await supabase
          .from('invoices')
          .update(updatePayload)
          .eq('id', invoice.id);

        if (updateError) {
          console.error('[SDI TEST] Errore aggiornamento fattura (XML semplice):', updateError);
        }
      }
    }

    const { error: messageSimpleError } = await supabase.from('sdi_messages').insert({
      provider_id: 'sdi_test',
      environment: 'TEST',
      invoice_id: invoiceId,
      sdi_identifier: identificativoSDI || idSDI || null,
      message_type: resolution.normalizedType,
      status: resolution.status || null,
      status_message: resolution.statusMessage,
      payload: {
        xml,
        parsed: notifica,
        headers: allHeaders,
        resolution,
        message_id: notifica.messageId || null,
        pec_message_id: notifica.pecMessageId || null,
      },
    });
    logSupabaseError('insert sdi_messages XML semplice', messageSimpleError);

    const { error: eventError } = await supabase.from('sdi_events').insert({
      provider_id: 'sdi_test',
      event_type: tipoNotifica || 'XML_NOTIFICATION_RECEIVED',
      payload: {
        xml,
        parsed: notifica,
        sdi_environment: 'TEST',
        headers: allHeaders,
        ssl_client_verify: sslClientVerify,
        ssl_client_dn: sslClientDN,
        notification_resolution: resolution,
        message_id: notifica.messageId || null,
        pec_message_id: notifica.pecMessageId || null,
      },
    });
    logSupabaseError('insert event XML_NOTIFICATION_RECEIVED', eventError);

    return new NextResponse(XML_OK_RESPONSE, {
      status: 200,
      headers: {
        'Content-Type': XML_CONTENT_TYPE,
      },
    });
  } catch (error) {
    console.error('[SDI TEST] Errore gestione richiesta:', error);
    return new NextResponse(soapResponse.xml, {
      status: 200,
      headers: {
        'Content-Type': soapResponse.contentType,
      },
    });
  }
}
 
