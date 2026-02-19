/**
 * API Route: Stato Transazione Movimenti Registro
 * GET /api/rentri/registri/transazioni/[id]/status
 * 
 * Verifica lo stato di elaborazione di una transazione movimenti
 * Pattern NONBLOCK_PULL_REST
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";
import { getActiveCert, getAudience, getGatewayUrl } from "@/lib/rentri/cert-helper";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const transazioneId = params.id;
    
    if (!transazioneId) {
      return NextResponse.json(
        { error: "transazione_id mancante" },
        { status: 400, headers }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("org_id");
    const environment = searchParams.get("environment") || undefined;
    const registroId = searchParams.get("registro_id");
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id richiesto come query param" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Se abbiamo registro_id, recupera environment dal registro (più affidabile)
    let envOverride = environment;
    if (registroId && !envOverride) {
      const { data: registro } = await supabase
        .from("rentri_registri")
        .select("environment")
        .eq("id", registroId)
        .maybeSingle();
      if (registro?.environment) envOverride = registro.environment;
    }
    
    // 1. Recupera certificato RENTRI (ambiente dinamico)
    const { cert, error: certErr } = await getActiveCert(orgId, envOverride);
    
    if (certErr || !cert) {
      return NextResponse.json(
        { error: certErr || "Certificato RENTRI non trovato" },
        { status: 404, headers }
      );
    }
    
    const RENTRI_BASE_URL = getGatewayUrl(cert.environment);
    
    // 2. Genera JWT per autenticazione
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: getAudience(cert.environment)
    });
    
    // 3. GET status transazione
    const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/${transazioneId}/status`;
    
    console.log(`[RENTRI-STATUS] Polling transazione ${transazioneId} su ${cert.environment}...`);
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtAuth}`,
        "Content-Type": "application/json"
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(30000)
    });
    
    // 200 = ancora in elaborazione
    if (rentriResponse.status === 200) {
      return NextResponse.json(
        {
          stato: "in_elaborazione",
          transazione_id: transazioneId
        },
        { status: 200, headers }
      );
    }
    
    // 303 = completata, Location contiene URL per result
    if (rentriResponse.status === 303) {
      const location = rentriResponse.headers.get("Location");
      return NextResponse.json(
        {
          stato: "completata",
          transazione_id: transazioneId,
          location: location,
          message: "Trasmettere GET alla location per ottenere il risultato"
        },
        { 
          status: 303, 
          headers: {
            ...headers,
            "Location": location || ""
          }
        }
      );
    }
    
    // Altri codici = errore
    let errorData = {};
    try {
      const text = await rentriResponse.text();
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { raw: text };
      }
    } catch (e) {
      errorData = { error: "Impossibile leggere risposta" };
    }
    
    console.error(`[RENTRI-STATUS] DEBUG - Errore da RENTRI:`, {
      status: rentriResponse.status,
      statusText: rentriResponse.statusText,
      errorData,
      url: rentriUrl
    });
    
    return NextResponse.json(
      {
        error: "Errore recupero stato transazione",
        status: rentriResponse.status,
        details: errorData
      },
      { status: rentriResponse.status, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-REGISTRI-STATUS] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

