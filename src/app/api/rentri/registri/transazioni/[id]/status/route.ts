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
    const registroId = searchParams.get("registro_id"); // Nuovo: per recuperare org_id/environment dal registro
    
    console.log(`[RENTRI-STATUS] DEBUG - Parametri ricevuti:`, {
      transazioneId,
      orgId,
      environment,
      registroId,
      queryParams: Object.fromEntries(searchParams.entries())
    });
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id richiesto come query param" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Se abbiamo registro_id, recupera org_id/environment dal registro (più affidabile)
    let finalOrgId = orgId;
    let finalEnvironment = environment;
    
    if (registroId) {
      console.log(`[RENTRI-STATUS] DEBUG - Recupero registro per ottenere org_id/environment corretti`);
      const { data: registro, error: registroError } = await supabase
        .from("rentri_registri")
        .select("org_id, environment")
        .eq("id", registroId)
        .maybeSingle();
      
      if (registroError) {
        console.error(`[RENTRI-STATUS] DEBUG - Errore recupero registro:`, registroError);
      } else if (registro) {
        finalOrgId = registro.org_id || orgId;
        finalEnvironment = registro.environment || environment;
        console.log(`[RENTRI-STATUS] DEBUG - Valori dal registro:`, {
          registro_org_id: registro.org_id,
          registro_environment: registro.environment,
          finalOrgId,
          finalEnvironment
        });
      } else {
        console.warn(`[RENTRI-STATUS] DEBUG - Registro ${registroId} non trovato, uso valori query params`);
      }
    }
    
    console.log(`[RENTRI-STATUS] DEBUG - Valori finali per ricerca certificato:`, {
      finalOrgId,
      finalEnvironment
    });
    
    // 1. Carica certificato RENTRI (prima prova con is_default, poi senza)
    let cert = null;
    let certError = null;
    
    // Prova prima con is_default = true
    console.log(`[RENTRI-STATUS] DEBUG - Ricerca certificato con is_default=true`);
    const { data: certDefault, error: errorDefault } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", finalOrgId)
      .eq("environment", finalEnvironment)
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();
    
    console.log(`[RENTRI-STATUS] DEBUG - Certificato con is_default:`, {
      trovato: !!certDefault,
      error: errorDefault?.message,
      cert_id: certDefault?.id
    });
    
    if (certDefault) {
      cert = certDefault;
      console.log(`[RENTRI-STATUS] DEBUG - Usando certificato con is_default=true`);
    } else {
      // Se non trovato, prendi il primo certificato attivo
      console.log(`[RENTRI-STATUS] DEBUG - Ricerca certificato attivo (senza is_default)`);
      const { data: certActive, error: errorActive } = await supabase
        .from("rentri_org_certificates")
        .select("*")
        .eq("org_id", finalOrgId)
        .eq("environment", finalEnvironment)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log(`[RENTRI-STATUS] DEBUG - Certificato attivo:`, {
        trovato: !!certActive,
        error: errorActive?.message,
        cert_id: certActive?.id
      });
      
      if (certActive) {
        cert = certActive;
        console.log(`[RENTRI-STATUS] DEBUG - Usando certificato attivo (senza is_default)`);
      } else {
        certError = errorActive || errorDefault;
        console.error(`[RENTRI-STATUS] DEBUG - Nessun certificato trovato:`, {
          errorDefault: errorDefault?.message,
          errorActive: errorActive?.message,
          org_id_cercato: finalOrgId,
          environment_cercato: finalEnvironment
        });
      }
    }
    
    if (certError || !cert) {
      // Log dettagliato per debug
      const { data: allCerts, error: allCertsError } = await supabase
        .from("rentri_org_certificates")
        .select("id, org_id, environment, is_active, is_default, cf_operatore")
        .eq("org_id", finalOrgId);
      
      console.error(`[RENTRI-STATUS] DEBUG - Certificati disponibili per org_id ${finalOrgId}:`, {
        count: allCerts?.length || 0,
        certificati: allCerts,
        error: allCertsError?.message
      });
      
      return NextResponse.json(
        { 
          error: "Certificato RENTRI non trovato",
          debug: {
            org_id_cercato: finalOrgId,
            environment_cercato: finalEnvironment,
            certificati_disponibili: allCerts?.length || 0
          }
        },
        { status: 404, headers }
      );
    }
    
    console.log(`[RENTRI-STATUS] DEBUG - Certificato trovato:`, {
      cert_id: cert.id,
      cf_operatore: cert.cf_operatore,
      is_default: cert.is_default,
      is_active: cert.is_active
    });
    
    // 2. Genera JWT per autenticazione
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
    });
    
    // 3. GET status transazione (endpoint usa solo transazione_id nel path)
    const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/${transazioneId}/status`;
    
    console.log(`[RENTRI-STATUS] DEBUG - Chiamata a RENTRI:`, {
      url: rentriUrl,
      method: "GET",
      jwt_length: jwtAuth.length,
      jwt_preview: jwtAuth.substring(0, 50) + "..."
    });
    
    const fetchHeaders: Record<string, string> = {
      "Authorization": `Bearer ${jwtAuth}`,
      "Content-Type": "application/json"
    };
    
    console.log(`[RENTRI-STATUS] DEBUG - Headers da inviare:`, {
      Authorization: fetchHeaders.Authorization ? `${fetchHeaders.Authorization.substring(0, 50)}...` : "MANCANTE!",
      "Content-Type": fetchHeaders["Content-Type"],
      keys: Object.keys(fetchHeaders)
    });
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "GET",
      headers: fetchHeaders,
      signal: AbortSignal.timeout(30000)
    });
    
    console.log(`[RENTRI-STATUS] DEBUG - Risposta RENTRI:`, {
      status: rentriResponse.status,
      statusText: rentriResponse.statusText,
      headers: Object.fromEntries(rentriResponse.headers.entries())
    });
    
    // Se 401, logga anche il body per capire l'errore
    if (rentriResponse.status === 401) {
      const errorBody = await rentriResponse.text().catch(() => "Impossibile leggere body");
      console.error(`[RENTRI-STATUS] DEBUG - Errore 401 da RENTRI:`, {
        status: rentriResponse.status,
        statusText: rentriResponse.statusText,
        body: errorBody,
        url: rentriUrl
      });
    }
    
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

