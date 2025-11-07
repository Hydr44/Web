// API SDI TEST – ricezione fatture/notifiche

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractFileFromSOAPMTOM } from '@/lib/sdi/soap-reception';
import { saveSDIFile, saveSOAPEnvelope } from '@/lib/sdi/storage';

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
    message: 'Endpoint SDI TEST attivo',
    method: 'POST',
  });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  const sslClientVerify = request.headers.get('x-ssl-client-verify') || '';
  const sslClientDN = request.headers.get('x-ssl-client-dn') || '';

  console.log('[SDI TEST][ricezione] Content-Type:', contentType);
  console.log('[SDI TEST][ricezione] X-SSL-Client-Verify:', sslClientVerify);
  console.log('[SDI TEST][ricezione] X-SSL-Client-DN:', sslClientDN);

  const headersSnapshot: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersSnapshot[key] = value;
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  const isSOAPMTOM = contentType.includes('multipart/related') || contentType.includes('application/soap+xml');

  try {
    if (isSOAPMTOM) {
      const extracted = await extractFileFromSOAPMTOM(request);

      if (supabase) {
        try {
          if (extracted.fileContent) {
            await saveSDIFile(extracted.fileName, extracted.fileContent, 'TEST');
          }
          if (extracted.soapEnvelope) {
            await saveSOAPEnvelope(extracted.soapEnvelope, extracted.fileName, 'TEST');
          }
        } catch (storageError) {
          console.error('[SDI TEST][ricezione] Errore salvataggio storage:', storageError);
        }

        await supabase.from('sdi_events').insert({
          event_type: 'SOAP_MTOM_RECEIVED',
          payload: {
            sdi_environment: 'TEST',
            file_name: extracted.fileName,
            xml_length: extracted.xml.length,
            headers: headersSnapshot,
            ssl_client_verify: sslClientVerify,
            ssl_client_dn: sslClientDN,
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

    const xml = await request.text();

    if (supabase) {
      await supabase.from('sdi_events').insert({
        event_type: 'XML_NOTIFICATION_RECEIVED',
        payload: {
          sdi_environment: 'TEST',
          xml_length: xml.length,
          headers: headersSnapshot,
          ssl_client_verify: sslClientVerify,
          ssl_client_dn: sslClientDN,
        },
      });
    }

    return new NextResponse(XML_OK_RESPONSE, {
      status: 200,
      headers: {
        'Content-Type': XML_CONTENT_TYPE,
      },
    });
  } catch (error) {
    console.error('[SDI TEST][ricezione] Errore gestione richiesta:', error);
    return new NextResponse(SOAP_OK_RESPONSE, {
      status: 200,
      headers: {
        'Content-Type': SOAP_CONTENT_TYPE,
      },
    });
  }
}
 
