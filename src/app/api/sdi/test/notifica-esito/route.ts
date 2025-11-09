import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSOAPClientConfig } from '@/lib/sdi/certificates';
import { sendNotificaEsitoToSDI } from '@/lib/sdi/soap-notifica-esito';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identificativoSdI = (body.identificativoSdI || '').toString().trim();
    const nomeFileInput = (body.nomeFile || '').toString().trim();
    const fileBase64Input = (body.fileBase64 || '').toString().trim();
    const notificaXml = (body.notificaXml || '').toString();

    if (!identificativoSdI) {
      return NextResponse.json(
        { success: false, error: 'identificativoSdI mancante' },
        { status: 400 }
      );
    }

    let fileBase64 = fileBase64Input;
    if (!fileBase64 && notificaXml) {
      fileBase64 = Buffer.from(notificaXml, 'utf8').toString('base64');
    }

    if (!fileBase64) {
      return NextResponse.json(
        { success: false, error: 'Fornire notificaXml o fileBase64' },
        { status: 400 }
      );
    }

    const nomeFile =
      nomeFileInput && nomeFileInput.toLowerCase().endsWith('.xml')
        ? nomeFileInput
        : `${identificativoSdI}_EC_001.xml`;

    const certConfig = getSOAPClientConfig('test');
    const result = await sendNotificaEsitoToSDI({
      identificativoSdI,
      nomeFile,
      fileBase64,
      environment: 'test',
      certConfig,
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      await supabase.from('sdi_events').insert({
        provider_id: 'sdi_test',
        event_type: 'NotificaEsitoInvio',
        payload: {
          identificativoSdI,
          nomeFile,
          success: result.success,
          esito: result.esito,
          scartoNomeFile: result.scartoNomeFile,
          scartoFileBase64: result.scartoFileBase64,
          endpoint: result.endpoint,
          httpStatus: result.httpStatus,
          soapResponse: result.soapResponse?.substring(0, 4096),
          error: result.error,
          message: result.message,
          attempts: result.attempts?.map((attempt) => ({
            endpoint: attempt.endpoint,
            error: attempt.error,
            message: attempt.message,
            httpStatus: attempt.httpStatus,
            soapResponsePreview: attempt.soapResponse?.substring(0, 512) ?? null,
          })),
        },
      });
    } catch (eventError) {
      console.error('[SDI TEST] Errore registrazione evento NotificaEsitoInvio:', eventError);
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
    });
  } catch (error: any) {
    console.error('[SDI TEST] Errore generale NotificaEsito API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Errore inatteso',
      },
      { status: 500 }
    );
  }
}

