// API SDI PRODUZIONE – ricezione fatture e notifiche (allineata al manuale SDI)

import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseSDIXML, parseSDINotification, resolveNotificationStatus } from '../_utils';
import { verifySDIRequest } from '@/lib/sdi/certificate-verification';
import { extractFileFromSOAPMTOM, extractFileSdIConMetadati, isSOAPRequest } from '@/lib/sdi/soap-reception';
import { saveSDIFile, saveSOAPEnvelope } from '@/lib/sdi/storage';
import { extractSOAPOperation, sanitizeSOAPEnvelope, SOAPOperation } from '@/lib/sdi/soap-parser';
import { buildEsitoCommittenteXML, SDIEsitoCode } from '@/lib/sdi/esito-committente';
import { getSOAPClientConfig } from '@/lib/sdi/certificates';
import { sendNotificaEsitoToSDI } from '@/lib/sdi/soap-notifica-esito';

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

const SOAP_1_1_NAMESPACE = 'http://schemas.xmlsoap.org/soap/envelope/';
const SDI_RICEZIONE_NAMESPACE = 'http://www.fatturapa.gov.it/sdi/ws/ricezione/v1.0';
const SOAP_OK_CONTENT_TYPE = 'text/xml; charset=utf-8';

function isAutoEsitoEnabled(environment: 'test' | 'production'): boolean {
  const envVar =
    environment === 'test'
      ? process.env.SDI_AUTO_ESITO_TEST
      : process.env.SDI_AUTO_ESITO_PROD;

  if (envVar === undefined) {
    return environment === 'test';
  }

  return envVar.trim().toLowerCase() === 'true';
}

async function sendAutomaticEsitoCommittente(params: {
  supabase: any;
  identificativoSdI?: string | null;
  fatturaNumero?: string | null;
  fatturaData?: string | null;
  nomeFileFattura?: string | null;
  providerId: 'sdi_test' | 'sdi_prod';
  environment: 'test' | 'production';
}) {
  const {
    supabase,
    identificativoSdI,
    fatturaNumero,
    fatturaData,
    nomeFileFattura,
    providerId,
    environment,
  } = params;

  if (!identificativoSdI || !isAutoEsitoEnabled(environment)) {
    return;
  }

  try {
    const esitoCodeEnv = (process.env.SDI_AUTO_ESITO_CODE || '').trim().toUpperCase();
    const esitoCode: SDIEsitoCode = esitoCodeEnv === 'EC02' ? 'EC02' : 'EC01';
    const descrizione =
      process.env.SDI_AUTO_ESITO_DESCRIZIONE ||
      (esitoCode === 'EC01' ? 'Accettazione automatica' : 'Rifiuto automatico');

    const esito = buildEsitoCommittenteXML({
      identificativoSdI,
      numeroFattura: fatturaNumero || undefined,
      dataFattura: fatturaData || undefined,
      nomeFileFattura: nomeFileFattura || undefined,
      esito: esitoCode,
      descrizione,
    });

    const certConfig = getSOAPClientConfig(environment);
    const result = await sendNotificaEsitoToSDI({
      identificativoSdI,
      nomeFile: esito.nomeFile,
      fileBase64: Buffer.from(esito.xml, 'utf8').toString('base64'),
      environment,
      certConfig,
    });

    await supabase.from('sdi_events').insert({
      provider_id: providerId,
      event_type: 'NotificaEsitoAuto',
      payload: {
        identificativoSdI,
        nomeFileEsito: esito.nomeFile,
        esito: esito.esito,
        messageIdCommittente: esito.messageIdCommittente,
        success: result.success,
        error: result.error,
        message: result.message,
        endpoint: result.endpoint,
        httpStatus: result.httpStatus,
        soapResponse: result.soapResponse?.substring(0, 4096),
        attempts: result.attempts,
        xml: esito.xml,
      },
    });
  } catch (error) {
    console.error('[SDI PROD] Errore invio automatico EsitoCommittente:', error);
  }
}

function buildSOAPOkResponse() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${SOAP_1_1_NAMESPACE}">
  <soap:Body>
    <rispostaRiceviFatture xmlns="${SDI_RICEZIONE_NAMESPACE}">
      <Esito>ER01</Esito>
    </rispostaRiceviFatture>
  </soap:Body>
</soap:Envelope>`;

  return { xml, contentType: SOAP_OK_CONTENT_TYPE };
}

function detectSoapNamespace(operation: SOAPOperation | null, envelope: string) {
  if (operation?.soapNamespaceURI) return operation.soapNamespaceURI;
  if (envelope.includes(SOAP_1_1_NAMESPACE)) return SOAP_1_1_NAMESPACE;
  return SOAP_1_1_NAMESPACE;
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
  let soapResponse = buildSOAPOkResponse();
  let notificaDecorrenzaTermini = false;

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
        soapEnvelope = sanitizeSOAPEnvelope(soapEnvelope);
        xml = sanitizeSOAPEnvelope(xml);
      } catch (extractError) {
        console.error('[SDI PROD] Errore estrazione MTOM:', extractError);
        xml = await request.text();
        soapEnvelope = sanitizeSOAPEnvelope(xml);
        xml = soapEnvelope;
        fileContent = Buffer.from(soapEnvelope, 'utf8');
      }

      soapEnvelope = sanitizeSOAPEnvelope(soapEnvelope);
      xml = sanitizeSOAPEnvelope(xml);

      const soapPreview = soapEnvelope.substring(0, 4096);
      console.log('[SDI PROD] SOAP preview (4KB):', soapPreview);

      soapOperation = extractSOAPOperation(soapEnvelope);
      if (soapOperation) {
        console.log('[SDI PROD] Operazione SOAP:', soapOperation);
        if (soapOperation.localName === 'NotificaDecorrenzaTermini') {
          notificaDecorrenzaTermini = true;
        }
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
      console.log('[SDI PROD] SOAP namespace rilevato:', detectedNamespace);
      console.log('[SDI PROD] SOAP namespace risposta forzato:', SOAP_1_1_NAMESPACE, 'Content-Type:', soapResponse.contentType);
    } else {
      xml = await request.text();
      xml = sanitizeSOAPEnvelope(xml);
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
            provider_id: 'sdi_prod',
            event_type: 'ErroreSalvataggioFattura',
            payload: {
              error: error.message,
              xml_length: xml.length,
              headers: allHeaders,
              ssl_client_verify: sslClientVerify,
              ssl_client_dn: sslClientDN,
              raw_soap_request: soapEnvelope.substring(0, 4096),
              soap_operation: soapOperation,
              soap_response_returned: notificaDecorrenzaTermini ? '' : soapResponse.xml.substring(0, 4096),
              file_sdi_metadata: fileSdIMetadata,
            },
          });
        } else {
          const { error: insertEventError } = await supabase.from('sdi_events').insert({
            provider_id: 'sdi_prod',
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
              soap_response_returned: notificaDecorrenzaTermini ? '' : soapResponse.xml.substring(0, 4096),
              identificativoSdI: fattura.identificativoSdI || fattura.idSDI || '',
              file_sdi_metadata: fileSdIMetadata,
            },
          });
          logSupabaseError('insert event FatturaRicevuta', insertEventError);

          void sendAutomaticEsitoCommittente({
            supabase,
            identificativoSdI:
              (fileSdIMetadata?.identificativoSdI as string | undefined) ||
              fattura.identificativoSDI ||
              fattura.idSDI ||
              null,
            fatturaNumero: fattura.numero,
            fatturaData: fattura.data,
            nomeFileFattura: (fileSdIMetadata?.nomeFile as string | undefined) || fileName,
            providerId: 'sdi_prod',
            environment: 'production',
          });
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
              message_id: notifica.messageId || null,
              pec_message_id: notifica.pecMessageId || null,
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
            soap_response_returned: notificaDecorrenzaTermini ? '' : soapResponse.xml.substring(0, 4096),
            identificativoSdI: identificativoSDI || idSDI || '',
            notification_resolution: resolution,
            message_id: notifica.messageId || null,
            pec_message_id: notifica.pecMessageId || null,
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
            soap_response_returned: notificaDecorrenzaTermini ? '' : soapResponse.xml.substring(0, 4096),
            file_sdi_metadata: fileSdIMetadata,
          },
        });
      }

      if (notificaDecorrenzaTermini) {
        console.log('[SDI PROD] Operazione NotificaDecorrenzaTermini - rispondo con HTTP 200 senza body');
        return new NextResponse('', {
          status: 200,
          headers: {
            'Content-Length': '0',
          },
        });
      }

      const responseBody = soapResponse.xml.replace(/\s{2,}/g, ' ').trim();
      const responseLength = Buffer.byteLength(responseBody, 'utf8');
      console.log('[SDI PROD] SOAP response (len):', responseLength, responseBody);

      return new NextResponse(responseBody, {
        status: 200,
        headers: {
          'Content-Type': soapResponse.contentType,
          'Content-Length': responseLength.toString(),
          'SOAPAction': '""',
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
        message_id: notifica.messageId || null,
        pec_message_id: notifica.pecMessageId || null,
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
    console.error('[SDI PROD] Errore gestione richiesta:', error);
    return new NextResponse(soapResponse.xml, {
      status: 200,
      headers: {
        'Content-Type': soapResponse.contentType,
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
 
