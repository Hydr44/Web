// API endpoint per trasmissione fatture al Sistema di Interscambio (SDI)
// Endpoint: POST /api/sdi/trasmissione
// 
// Questo endpoint invia fatture elettroniche al SDI (ambiente PRODUZIONE)
// Quando emetti una fattura, questo endpoint la invia al SDI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSDIResponse, logSupabaseError } from '../_utils';
import { sendInvoiceToSDI, generateSDIFileName } from '@/lib/sdi/soap-client';
import { generateFatturaPAXML, invoiceToFatturaPAData } from '@/lib/sdi/xml-generator';
import { saveSDIFile, saveSOAPEnvelope } from '@/lib/sdi/storage';

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
    // Ricevi richiesta di trasmissione fattura
    const body = await request.json();
    const { invoice_id, xml } = body;

    if (!invoice_id && !xml) {
      return createSDIResponse(
        { success: false, error: 'invoice_id o xml richiesto' },
        400
      );
    }

    console.log('[SDI] Trasmissione fattura richiesta:', {
      invoice_id,
      xml_length: xml?.length,
      environment: 'PRODUCTION',
    });

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

    let invoice: any = null;
    let invoiceXml: string = xml;

    // Se invoice_id è fornito, recupera fattura dal database
    if (invoice_id) {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', invoice_id)
        .single();

      if (invoiceError || !invoiceData) {
        return createSDIResponse(
          { success: false, error: 'Fattura non trovata' },
          404
        );
      }

      invoice = invoiceData;

      // Se XML non è fornito, genera XML da fattura
      if (!invoiceXml && invoice) {
        // Recupera impostazioni organizzazione per dati cedente
        const { data: orgSettings } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', invoice.org_id)
          .single();

        // Genera XML FatturaPA
        const fatturaPAData = invoiceToFatturaPAData(invoice, orgSettings);
        invoiceXml = generateFatturaPAXML(fatturaPAData);
      }
    }

    if (!invoiceXml || invoiceXml.trim().length === 0) {
      return createSDIResponse(
        { success: false, error: 'XML fattura mancante o vuoto' },
        400
      );
    }

    // Genera nome file conforme SDI
    const vatNumber = invoice?.meta?.sdi?.cedente_prestatore?.id_fiscale_iva?.id_codice || '02166430856';
    const invoiceNumber = invoice?.number || '00001';
    const fileName = generateSDIFileName(vatNumber, invoiceNumber);

    // Invia fattura al SDI tramite web service SOAP
    const sdiResponse = await sendInvoiceToSDI(invoiceXml, fileName, 'production');

    const environmentLabel = 'PRODUCTION';
    const defaultSignedFileName = fileName.endsWith('.xml') ? fileName.replace(/\.xml$/, '.xml.p7m') : `${fileName}.xml.p7m`;
    const signedFileName = sdiResponse.signedFileName || defaultSignedFileName;
    const signedFileBase = signedFileName.replace(/\.xml\.p7m$/, '').replace(/\.p7m$/, '');

    let signedFileInfo: { url: string; path: string } | null = null;
    let soapRequestInfo: { url: string; path: string } | null = null;
    let soapResponseInfo: { url: string; path: string } | null = null;

    try {
      if (sdiResponse.signedBuffer) {
        signedFileInfo = await saveSDIFile(signedFileName, sdiResponse.signedBuffer, environmentLabel);
      }
      if (sdiResponse.soapEnvelope) {
        const requestName = `${signedFileBase}-request.xml`;
        soapRequestInfo = await saveSOAPEnvelope(sdiResponse.soapEnvelope, requestName, environmentLabel);
      }
      if (sdiResponse.soapResponse) {
        const responseName = `${signedFileBase}-response.xml`;
        soapResponseInfo = await saveSOAPEnvelope(sdiResponse.soapResponse, responseName, environmentLabel);
      }
    } catch (artifactError) {
      console.error('[SDI] Errore salvataggio artefatti trasmissione:', artifactError);
    }

    if (!sdiResponse.success) {
      console.warn('[SDI] Trasmissione SDI fallita, registrazione evento in Supabase', {
        endpoint: sdiResponse.endpoint,
        httpStatus: sdiResponse.httpStatus,
      });
      const { data: failedEvent, error: insertFailedError } = await supabase
        .from('sdi_events')
        .insert({
        provider_id: 'sdi_prod',
        invoice_id: invoice_id || null,
        event_type: 'TrasmissioneFattura_Fallita',
        payload: {
          identificativo_sdi: sdiResponse.identificativoSDI || null,
          xml_length: invoiceXml.length,
          sent_at: new Date().toISOString(),
          environment: environmentLabel,
          error: sdiResponse.error,
          message: sdiResponse.message,
          soap_endpoint: sdiResponse.endpoint || null,
          soap_http_status: sdiResponse.httpStatus || null,
          soap_request_preview: sdiResponse.soapEnvelope?.substring(0, 4096) || null,
          soap_response_preview: sdiResponse.soapResponse?.substring(0, 4096) || null,
          soap_request_url: soapRequestInfo?.url || null,
          soap_response_url: soapResponseInfo?.url || null,
          signed_file_url: signedFileInfo?.url || null,
          boundary: sdiResponse.boundary || null,
          debug: sdiResponse.debug || null,
        },
        })
        .select('id')
        .single();
      if (failedEvent) {
        console.log('[SDI] Evento TrasmissioneFattura_Fallita creato con id:', failedEvent.id);
      }
      logSupabaseError('insert event TrasmissioneFattura_Fallita', insertFailedError);

      return createSDIResponse(
        {
          success: false,
          error: sdiResponse.error || 'Errore invio al SDI',
          message: sdiResponse.message,
        },
        500
      );
    }

    if (invoice_id && sdiResponse.identificativoSDI) {
      const sentAt = new Date().toISOString();
      const existingMeta = (invoice as any)?.meta || {};

      await supabase
        .from('invoices')
        .update({
          sdi_status: 'sent',
          provider_ext_id: sdiResponse.identificativoSDI,
          meta: {
            ...existingMeta,
            sdi_sent: true,
            sdi_sent_at: sentAt,
            sdi_xml: invoiceXml,
            sdi_environment: environmentLabel,
            updated_at: sentAt,
            sdi_transmission: {
              identificativo_sdi: sdiResponse.identificativoSDI,
              signed_file_name: signedFileName,
              signed_file_url: signedFileInfo?.url || null,
              signed_file_path: signedFileInfo?.path || null,
              soap_endpoint: sdiResponse.endpoint || null,
              soap_http_status: sdiResponse.httpStatus || null,
              soap_request_url: soapRequestInfo?.url || null,
              soap_response_url: soapResponseInfo?.url || null,
              boundary: sdiResponse.boundary || null,
            },
          },
        })
        .eq('id', invoice_id);

      const { data: successEvent, error: insertSuccessError } = await supabase
        .from('sdi_events')
        .insert({
        provider_id: 'sdi_prod',
        invoice_id,
        event_type: 'TrasmissioneFattura',
        payload: {
          identificativo_sdi: sdiResponse.identificativoSDI,
          xml_length: invoiceXml.length,
          sent_at: sentAt,
          environment: environmentLabel,
          soap_endpoint: sdiResponse.endpoint || null,
          soap_http_status: sdiResponse.httpStatus || null,
          soap_request_preview: sdiResponse.soapEnvelope?.substring(0, 4096) || null,
          soap_response_preview: sdiResponse.soapResponse?.substring(0, 4096) || null,
          soap_request_url: soapRequestInfo?.url || null,
          soap_response_url: soapResponseInfo?.url || null,
          signed_file_url: signedFileInfo?.url || null,
          boundary: sdiResponse.boundary || null,
          debug: sdiResponse.debug || null,
        },
        })
        .select('id')
        .single();
      if (successEvent) {
        console.log('[SDI] Evento TrasmissioneFattura creato con id:', successEvent.id);
      }
      logSupabaseError('insert event TrasmissioneFattura', insertSuccessError);
    }

    console.log('[SDI] Fattura trasmessa:', {
      invoice_id,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

    return createSDIResponse({
      success: true,
      message: sdiResponse.message || 'Fattura inviata al SDI (PRODUZIONE)',
      invoice_id: invoice_id || null,
      identificativo_sdi: sdiResponse.identificativoSDI,
    });

  } catch (error: any) {
    console.error('[SDI] Errore trasmissione fattura:', error);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: exceptionEvent, error: exceptionInsertError } = await supabase
          .from('sdi_events')
          .insert({
            provider_id: 'sdi_prod',
            event_type: 'TrasmissioneFattura_Exception',
            payload: {
              error: error.message,
              stack: error.stack,
            },
          })
          .select('id')
          .single();
        if (exceptionEvent) {
          console.log('[SDI] Evento TrasmissioneFattura_Exception creato con id:', exceptionEvent.id);
        }
        logSupabaseError('insert event TrasmissioneFattura_Exception', exceptionInsertError);
      }
    } catch (logError) {
      console.error('[SDI] Impossibile registrare evento di eccezione:', logError);
    }
    return createSDIResponse(
      {
        success: false,
        error: error.message || 'Errore trasmissione fattura',
      },
      500
    );
  }
}

