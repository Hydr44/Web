/**
 * API Route: Test Validazione SDI
 * GET /api/sdi/test-validation
 * Testa le API di validazione Vies e IPA
 */

import { NextRequest, NextResponse } from "next/server";
import { handleCors, corsHeaders } from "@/lib/cors";
import { validatePIVAVies, validateCodiceDestinatarioIPA } from "@/lib/sdi-validation";

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

/**
 * GET /api/sdi/test-validation
 * Testa validazione P.IVA e Codice Destinatario
 * Query params: ?piva=IT12345678901&codice=T04ZHR3
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { searchParams } = new URL(request.url);
    const piva = searchParams.get('piva');
    const codice = searchParams.get('codice');

    const results: any = {};

    // Test Vies se P.IVA fornita
    if (piva) {
      try {
        const viesResult = await validatePIVAVies(piva);
        results.vies = {
          piva,
          ...viesResult,
          timestamp: new Date().toISOString()
        };
      } catch (error: any) {
        results.vies = {
          piva,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Test IPA se Codice fornito
    if (codice) {
      try {
        const ipaResult = await validateCodiceDestinatarioIPA(codice);
        results.ipa = {
          codice,
          ...ipaResult,
          timestamp: new Date().toISOString()
        };
      } catch (error: any) {
        results.ipa = {
          codice,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        results
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[SDI-TEST-VALIDATION] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}
