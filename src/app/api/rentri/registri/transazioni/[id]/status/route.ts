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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENTRI_BASE_URL = process.env.RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu';

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
    
    // TODO: Recupera org_id e environment dalla transazione
    // Per ora, assumiamo che l'utente li passi nei query params o header
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("org_id");
    const environment = searchParams.get("environment") || "demo";
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id richiesto come query param" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Carica certificato RENTRI
    const { data: cert, error: certError } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", orgId)
      .eq("environment", environment)
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();
    
    if (certError || !cert) {
      return NextResponse.json(
        { error: "Certificato RENTRI non trovato" },
        { status: 404, headers }
      );
    }
    
    // 2. Genera JWT per autenticazione
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
    });
    
    // 3. GET status transazione (endpoint usa solo transazione_id nel path)
    const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/${transazioneId}/status`;
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtAuth}`,
        "Content-Type": "application/json"
      },
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
    const errorData = await rentriResponse.json().catch(() => ({}));
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

