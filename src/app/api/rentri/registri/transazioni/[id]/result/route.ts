/**
 * API Route: Esito Transazione Movimenti Registro
 * GET /api/rentri/registri/transazioni/[id]/result
 * 
 * Recupera l'esito dell'elaborazione di una transazione movimenti
 * Pattern NONBLOCK_PULL_REST
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { mapRentriEsitoToLocal } from "@/lib/rentri/movimento-builder";
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
    const registroId = searchParams.get("registro_id");
    const environment = searchParams.get("environment") || undefined;
    
    if (!orgId || !registroId) {
      return NextResponse.json(
        { error: "org_id e registro_id richiesti come query param" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Recupera environment dal registro se non specificato
    let envOverride = environment;
    if (!envOverride) {
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
    
    // 3. GET result transazione
    const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/${transazioneId}/result`;
    
    console.log(`[RENTRI-RESULT] Recupero esito transazione ${transazioneId} su ${cert.environment}...`);
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtAuth}`,
        "Content-Type": "application/json"
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(30000)
    });
    
    if (!rentriResponse.ok) {
      const errorData = await rentriResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Errore recupero esito transazione",
          status: rentriResponse.status,
          details: errorData
        },
        { status: rentriResponse.status, headers }
      );
    }
    
    const esitoRentri = await rentriResponse.json();
    
    // 4. Mappa esito al formato locale
    const esitoLocale = mapRentriEsitoToLocal(esitoRentri);
    
    // 5. Aggiorna movimenti nel database in base all'esito
    if (esitoLocale.movimenti_validati && esitoLocale.movimenti_validati.length > 0) {
      // Aggiorna movimenti validati con successo
      for (const movimentoValidato of esitoLocale.movimenti_validati) {
        const movimentoId = movimentoValidato.movimento_id; // Assumendo che RENTRI restituisca questo
        const rentriId = movimentoValidato.identificativo || movimentoValidato.rentri_id;
        
        if (movimentoId) {
          await supabase
            .from("rentri_movimenti")
            .update({
              sync_status: "trasmesso",
              rentri_id: rentriId,
              rentri_stato: "validato",
              sync_at: new Date().toISOString(),
              sync_error: null
            })
            .eq("id", movimentoId);
        }
      }
    }
    
    // Aggiorna movimenti con errori
    if (esitoLocale.errori && esitoLocale.errori.length > 0) {
      // TODO: Mappare errori ai movimenti specifici
      await supabase
        .from("rentri_movimenti")
        .update({
          sync_status: "error",
          sync_error: JSON.stringify(esitoLocale.errori),
          sync_at: new Date().toISOString()
        })
        .eq("registro_id", registroId)
        .eq("sync_status", "in_trasmissione");
    }
    
    return NextResponse.json(
      {
        success: true,
        transazione_id: transazioneId,
        esito: esitoLocale,
        esito_raw: esitoRentri
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-REGISTRI-RESULT] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

