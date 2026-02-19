/**
 * API Route: Recupera Autorizzazioni Unità Locale da RENTRI
 * GET /api/rentri/siti/autorizzazioni?org_id=...&num_iscr_sito=...
 * 
 * Recupera le autorizzazioni dell'unità locale da RENTRI
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

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { searchParams } = new URL(request.url);
    const org_id = searchParams.get('org_id');
    const num_iscr_sito = searchParams.get('num_iscr_sito');
    const environment = searchParams.get('environment') || undefined;
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!num_iscr_sito) {
      return NextResponse.json(
        { error: "num_iscr_sito mancante" },
        { status: 400, headers }
      );
    }
    
    // 1. Recupera certificato RENTRI (ambiente dinamico)
    const { cert, error: certErr } = await getActiveCert(org_id, environment);
    
    if (certErr || !cert) {
      return NextResponse.json(
        { error: certErr || "Certificato RENTRI non trovato per questa organizzazione" },
        { status: 404, headers }
      );
    }
    
    const RENTRI_BASE_URL = getGatewayUrl(cert.environment);
    
    // Estrai num_iscr dal num_iscr_sito (formato: OP123XXXXXXXX00-PD00001)
    const num_iscr = num_iscr_sito.split('-')[0];
    
    if (!num_iscr) {
      return NextResponse.json(
        { error: "num_iscr_sito non valido" },
        { status: 400, headers }
      );
    }
    
    // 2. Genera JWT per autenticazione RENTRI
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: getAudience(cert.environment),
    });
    
    // 3. Chiama RENTRI per recuperare autorizzazioni
    // GET /anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}/autorizzazioni
    const rentriUrl = `${RENTRI_BASE_URL}/anagrafiche/v1.0/operatore/${num_iscr}/siti/${num_iscr_sito}/autorizzazioni`;
    
    console.log(`[RENTRI-AUTORIZZAZIONI] Recupero autorizzazioni per ${num_iscr_sito}...`);
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtAuth}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (!rentriResponse.ok) {
      const errorData = await rentriResponse.json().catch(() => ({}));
      console.error("[RENTRI-AUTORIZZAZIONI] Errore chiamata RENTRI:", errorData);
      return NextResponse.json(
        {
          error: "Errore recupero autorizzazioni da RENTRI",
          status: rentriResponse.status,
          details: errorData
        },
        { status: rentriResponse.status, headers }
      );
    }
    
    const autorizzazioni = await rentriResponse.json();
    
    if (!Array.isArray(autorizzazioni)) {
      return NextResponse.json(
        { error: "Risposta RENTRI non valida (atteso array)" },
        { status: 500, headers }
      );
    }
    
    console.log(`[RENTRI-AUTORIZZAZIONI] Ricevute ${autorizzazioni.length} autorizzazioni da RENTRI`);
    
    return NextResponse.json(
      {
        success: true,
        autorizzazioni: autorizzazioni
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-AUTORIZZAZIONI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

