// API SDI PRODUZIONE – ricezione fatture e notifiche (allineata al manuale SDI)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseSDIXML, parseSDINotification, resolveNotificationStatus } from '../_utils';
import { verifySDIRequest } from '@/lib/sdi/certificate-verification';
import { extractFileFromSOAPMTOM, extractFileSdIConMetadati, isSOAPRequest } from '@/lib/sdi/soap-reception';
import { saveSDIFile, saveSOAPEnvelope } from '@/lib/sdi/storage';
import { extractSOAPOperation, SOAPOperation } from '@/lib/sdi/soap-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '20mb',
  },
};

const SOAP_OK_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <EsitoCommittente xmlns="http://www.fatturapa.gov.it/sdi/messaggi/v1.0">
      <Esito>OK</Esito>
    </EsitoCommittente>
  </soap:Body>
</soap:Envelope>`;

const XML_OK_RESPONSE = '<?xml version="1.0" encoding="UTF-8"?><Esito>OK</Esito>';

const SOAP_CONTENT_TYPE = 'application/soap+xml; charset=utf-8';
const XML_CONTENT_TYPE = 'application/xml; charset=utf-8';

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
    message: 'Endpoint SDI PRODUZIONE attivo',
    method: 'POST',
  });
}

export async function POST(request: NextRequest) {
  console.log('========================================');
  console.log('[SDI PROD] POST /api/sdi/ricezione');
  console.log('[SDI PROD] Timestamp:', new Date().toISOString());
  console.log('[SDI PROD] URL:', request.url);
  console.log('========================================');

  const contentType = request.headers.get('content-type') || '';
  const sslClientVerify = request.headers.get('x-ssl-client-verify') || '';
  const sslClientDN = request.headers.get('x-ssl-client-dn') || '';

  console.log('[SDI PROD] Content-Type:', contentType);
  console.log('[SDI PROD] X-SSL-Client-Verify:', sslClientVerify);
  console.log('[SDI PROD] X-SSL-Client-DN:', sslClientDN);

  const allHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });
  console.log('[SDI PROD] Headers:', JSON.stringify(allHeaders, null, 2));

  const verified = verifySDIRequest(request, 'production');
  if (!verified) {
    console.warn('[SDI PROD] Verifica SDI non riuscita (produzione: log, ma non blocchiamo qui)');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const isSoapEnvelope = isSOAPRequest(request);
  const environment = 'PRODUCTION';
  let soapEnvelope = '';
  let xml = '';
  let fileName = 'sdi-payload.xml';
  let fileContent: Buffer | null = null;
  let soapOperation: SOAPOperation | null = null;
  let fileSdIMetadata: Record<string, any> | null = null;

  try {
    if (isSoapEnvelope) {
      console.log('[SDI PROD] Richiesta SOAP con MTOM');
      try {
        const extracted = await extractFileFromSOAPMTOM(request);
        soapEnvelope = extracted.soapEnvelope || '';
        xml = extracted.xml;
        fileName = extracted.fileName;
        fileContent = extracted.fileContent;
        console.log('[SDI PROD] File estratto:', fileName, 'size:', fileContent ? fileContent.length : 0, 'bytes');
      } catch (extractError) {
        console.error('[SDI PROD] Errore estrazione MTOM:', extractError);
        xml = await request.text();
        soapEnvelope = xml;
        fileContent = Buffer.from(xml, 'utf8');
      }

      const soapPreview = soapEnvelope.substring(0, 4096);
      console.log('[SDI PROD] SOAP preview (4KB):', soapPreview);

      soapOperation = extractSOAPOperation(soapEnvelope);
      if (soapOperation) {
        console.log('[SDI PROD] Operazione SOAP:', soapOperation);
      } else {
        console.log('[SDI PROD] Operazione SOAP non rilevata');
      }

      if (soapEnvelope) {
        const fileSdIExtraction = extractFileSdIConMetadati(soapEnvelope);
        if (fileSdIExtraction) {
          console.log('[SDI PROD] Riconosciuto payload fileSdIConMetadati');
          fileName = fileSdIExtraction.fileName || fileName;
          fileContent = fileSdIExtraction.fileContent || fileContent;
          if (fileSdIExtraction.xml && fileSdIExtraction.xml.trim()) {
            xml = fileSdIExtraction.xml;
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
    } else {
      xml = await request.text();
      console.log('[SDI PROD] XML (prima di 2KB):', xml.substring(0, 2048));
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
        console.error('[SDI PROD] Errore salvataggio storage:', storageError);
      }

      if (isFattura) {
        const fattura = parseSDIXML(xml);
        const { data, error } = await supabase
          .from('invoices')
          .insert({
            org_id: '1ea3be12-a439-46ac-94d9-eaff1bb346c2',
            provider_id: 'sdi_prod',
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

        if (error) {
          logSupabaseError('insert invoice', error);
          await supabase.from('sdi_events').insert({
            provider_id: 'sdi',
            event_type: 'ErroreSalvataggioFattura',
            payload: {
              error: error.message,
              xml_length: xml.length,
              headers: allHeaders,
              ssl_client_verify: sslClientVerify,
              ssl_client_dn: sslClientDN,
              raw_soap_request: soapEnvelope.substring(0, 4096),
              soap_operation: soapOperation,
              soap_response_returned: SOAP_OK_RESPONSE.substring(0, 4096),
              file_sdi_metadata: fileSdIMetadata,
            },
          });
        } else {
          const { error: insertEventError } = await supabase.from('sdi_events').insert({
            provider_id: 'sdi',
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
              soap_response_returned: SOAP_OK_RESPONSE.substring(0, 4096),
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
            console.error('[SDI PROD] Errore aggiornamento stato fattura:', updateError);
          }
        }

        try {
          await supabase.from('sdi_messages').insert({
            provider_id: 'sdi',
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
            },
          });
        } catch (messageError) {
          console.error('[SDI PROD] Errore salvataggio sdi_messages:', messageError);
        }

        await supabase.from('sdi_events').insert({
          provider_id: 'sdi',
          event_type: tipoNotifica || 'NOTIFICA_SOAP',
          payload: {
            xml,
            parsed: notifica,
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
            soap_response_returned: SOAP_OK_RESPONSE.substring(0, 4096),
            identificativoSdI: identificativoSDI || idSDI || '',
            notification_resolution: resolution,
          },
        });
      } else {
        console.warn('[SDI PROD] XML SOAP non riconosciuto come fattura/notifica');
        await supabase.from('sdi_events').insert({
          provider_id: 'sdi',
          event_type: 'XML_SOAP_NON_RICONOSCIUTO',
          payload: {
            xml_preview: xml.substring(0, 1000),
            sdi_environment: environment,
            headers: allHeaders,
            ssl_client_verify: sslClientVerify,
            ssl_client_dn: sslClientDN,
            raw_soap_request: soapEnvelope.substring(0, 4096),
            soap_operation: soapOperation,
            soap_response_returned: SOAP_OK_RESPONSE.substring(0, 4096),
            file_sdi_metadata: fileSdIMetadata,
          },
        });
      }

      return new NextResponse(SOAP_OK_RESPONSE, {
        status: 200,
        headers: {
          'Content-Type': SOAP_CONTENT_TYPE,
        },
      });
    }

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
            sdi_environment: environment,
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
          console.error('[SDI PROD] Errore aggiornamento fattura (XML semplice):', updateError);
        }
      }
    }

    const { error: messageSimpleError } = await supabase.from('sdi_messages').insert({
      provider_id: 'sdi',
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
        resolution,
      },
    });
    logSupabaseError('insert sdi_messages XML semplice', messageSimpleError);

    const { error: eventError } = await supabase.from('sdi_events').insert({
      provider_id: 'sdi',
      event_type: tipoNotifica || 'XML_NOTIFICATION_RECEIVED',
      payload: {
        xml,
        parsed: notifica,
        sdi_environment: environment,
        headers: allHeaders,
        ssl_client_verify: sslClientVerify,
        ssl_client_dn: sslClientDN,
        notification_resolution: resolution,
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
    console.error('[SDI PROD] Errore gestione richiesta:', error);
    return new NextResponse(SOAP_OK_RESPONSE, {
      status: 200,
      headers: {
        'Content-Type': SOAP_CONTENT_TYPE,
      },
    });
  }
}

function logSupabaseError(context: string, error: any) {
  if (!error) return;
  console.error(`[SDI PROD] Errore Supabase (${context}):`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}
 
