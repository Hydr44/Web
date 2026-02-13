/**
 * API Route: Scarica PDF ufficiale FIR da RENTRI
 * GET /api/rentri/fir/pdf?fir_id={id}
 *
 * Il PDF del FIR è un documento ufficiale generato esclusivamente da RENTRI.
 * Endpoint RENTRI: GET /formulari/v1.0/{numero_fir}/pdf
 * Risposta RENTRI: DownloadableBaseResponse { nome_file, mime, content (Base64) }
 *
 * Ref: formulari-v1.0.json — /{numero_fir}/pdf
 * Pattern numero_fir: ^([BCDFGHJKLMNPQRSTVWXYZ]{4,6})[ -/_]*([0-9]+)[ -/_]*([BCDFGHJKLMNPQRSTVWXYZ]{1,2})$
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const searchParams = request.nextUrl.searchParams;
    const fir_id = searchParams.get('fir_id');

    if (!fir_id) {
      return NextResponse.json(
        { error: 'fir_id richiesto' },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Carica FIR dal database
    const { data: fir, error: firError } = await supabase
      .from('rentri_formulari')
      .select('*')
      .eq('id', fir_id)
      .single();

    if (firError || !fir) {
      return NextResponse.json(
        { error: 'FIR non trovato nel database' },
        { status: 404, headers }
      );
    }

    // 2. Il numero_fir RENTRI è obbligatorio — senza non si può richiedere il PDF
    const numeroFir = fir.rentri_numero;

    if (!numeroFir) {
      return NextResponse.json(
        { error: 'FIR non ancora trasmesso a RENTRI. Il PDF è disponibile solo dopo la trasmissione e l\'assegnazione del numero FIR ufficiale.' },
        { status: 400, headers }
      );
    }

    // 3. Carica certificato RENTRI dell'organizzazione
    const { data: cert, error: certError } = await supabase
      .from('rentri_org_certificates')
      .select('*')
      .eq('org_id', fir.org_id)
      .eq('environment', fir.environment || 'demo')
      .eq('is_active', true)
      .eq('is_default', true)
      .maybeSingle();

    if (certError || !cert) {
      return NextResponse.json(
        { error: 'Certificato RENTRI non trovato per questa organizzazione' },
        { status: 404, headers }
      );
    }

    // 4. Genera JWT per autenticazione RENTRI
    const jwt = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: cert.environment === 'demo' ? 'rentrigov.demo.api' : 'rentrigov.api'
    });

    // 5. Chiama RENTRI: GET /formulari/v1.0/{numero_fir}/pdf
    // La risposta è un DownloadableBaseResponse (JSON) con il PDF in Base64
    const baseUrl = cert.environment === 'demo'
      ? 'https://demoapi.rentri.gov.it'
      : 'https://api.rentri.gov.it';

    const pdfUrl = `${baseUrl}/formulari/v1.0/${encodeURIComponent(numeroFir)}/pdf`;

    console.log(`[RENTRI-PDF] Richiesta PDF per FIR ${numeroFir}: ${pdfUrl}`);

    const rentriResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(30000)
    });

    // 204 = No Content (PDF non ancora disponibile)
    if (rentriResponse.status === 204) {
      return NextResponse.json(
        { error: 'PDF non ancora disponibile su RENTRI. Il FIR potrebbe essere ancora in elaborazione.' },
        { status: 204, headers }
      );
    }

    if (!rentriResponse.ok) {
      const errorBody = await rentriResponse.text().catch(() => '');
      console.error(`[RENTRI-PDF] Errore RENTRI ${rentriResponse.status}:`, errorBody);

      return NextResponse.json(
        {
          error: `PDF non disponibile da RENTRI (${rentriResponse.status})`,
          details: errorBody || rentriResponse.statusText
        },
        { status: rentriResponse.status, headers }
      );
    }

    // 6. Parse DownloadableBaseResponse: { nome_file, mime, content }
    const downloadResponse = await rentriResponse.json();

    if (!downloadResponse.content) {
      console.error('[RENTRI-PDF] Risposta RENTRI senza campo content:', downloadResponse);
      return NextResponse.json(
        { error: 'Risposta RENTRI non valida: campo "content" mancante' },
        { status: 502, headers }
      );
    }

    // 7. Decodifica Base64 → Buffer PDF
    const pdfBuffer = Buffer.from(downloadResponse.content, 'base64');

    // Verifica magic number PDF (%PDF)
    if (pdfBuffer.length < 4 || pdfBuffer[0] !== 0x25 || pdfBuffer[1] !== 0x50 || pdfBuffer[2] !== 0x44 || pdfBuffer[3] !== 0x46) {
      console.error('[RENTRI-PDF] Il contenuto decodificato non è un PDF valido (magic number mismatch)');
      return NextResponse.json(
        { error: 'Il file ricevuto da RENTRI non è un PDF valido' },
        { status: 502, headers }
      );
    }

    const fileName = downloadResponse.nome_file || `fir-${numeroFir}.pdf`;
    const mimeType = downloadResponse.mime || 'application/pdf';

    console.log(`[RENTRI-PDF] PDF ricevuto: ${fileName} (${pdfBuffer.length} bytes)`);

    // 8. Ritorna PDF binario al client
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': mimeType,
        'Content-Length': String(pdfBuffer.length),
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error: any) {
    console.error('[RENTRI-PDF] Errore:', error);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout: RENTRI non ha risposto entro 30 secondi' },
        { status: 504, headers }
      );
    }

    return NextResponse.json(
      { error: 'Errore interno server', details: error.message },
      { status: 500, headers }
    );
  }
}
