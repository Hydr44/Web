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
    
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("org_id");
    const registroId = searchParams.get("registro_id");
    const environment = searchParams.get("environment") || "demo";
    
    console.log(`[RENTRI-RESULT] DEBUG - Parametri ricevuti:`, {
      transazioneId,
      orgId,
      environment,
      registroId,
      queryParams: Object.fromEntries(searchParams.entries())
    });
    
    if (!orgId || !registroId) {
      return NextResponse.json(
        { error: "org_id e registro_id richiesti come query param" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Recupera org_id/environment dal registro (più affidabile)
    let finalOrgId = orgId;
    let finalEnvironment = environment;
    
    console.log(`[RENTRI-RESULT] DEBUG - Recupero registro per ottenere org_id/environment corretti`);
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("org_id, environment")
      .eq("id", registroId)
      .maybeSingle();
    
    if (registroError) {
      console.error(`[RENTRI-RESULT] DEBUG - Errore recupero registro:`, registroError);
    } else if (registro) {
      finalOrgId = registro.org_id || orgId;
      finalEnvironment = registro.environment || environment;
      console.log(`[RENTRI-RESULT] DEBUG - Valori dal registro:`, {
        registro_org_id: registro.org_id,
        registro_environment: registro.environment,
        finalOrgId,
        finalEnvironment
      });
    } else {
      console.warn(`[RENTRI-RESULT] DEBUG - Registro ${registroId} non trovato, uso valori query params`);
    }
    
    console.log(`[RENTRI-RESULT] DEBUG - Valori finali per ricerca certificato:`, {
      finalOrgId,
      finalEnvironment
    });
    
    // 1. Carica certificato RENTRI (prima prova con is_default, poi senza)
    let cert = null;
    let certError = null;
    
    // Prova prima con is_default = true
    console.log(`[RENTRI-RESULT] DEBUG - Ricerca certificato con is_default=true`);
    const { data: certDefault, error: errorDefault } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", finalOrgId)
      .eq("environment", finalEnvironment)
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();
    
    console.log(`[RENTRI-RESULT] DEBUG - Certificato con is_default:`, {
      trovato: !!certDefault,
      error: errorDefault?.message,
      cert_id: certDefault?.id
    });
    
    if (certDefault) {
      cert = certDefault;
      console.log(`[RENTRI-RESULT] DEBUG - Usando certificato con is_default=true`);
    } else {
      // Se non trovato, prendi il primo certificato attivo
      console.log(`[RENTRI-RESULT] DEBUG - Ricerca certificato attivo (senza is_default)`);
      const { data: certActive, error: errorActive } = await supabase
        .from("rentri_org_certificates")
        .select("*")
        .eq("org_id", finalOrgId)
        .eq("environment", finalEnvironment)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log(`[RENTRI-RESULT] DEBUG - Certificato attivo:`, {
        trovato: !!certActive,
        error: errorActive?.message,
        cert_id: certActive?.id
      });
      
      if (certActive) {
        cert = certActive;
        console.log(`[RENTRI-RESULT] DEBUG - Usando certificato attivo (senza is_default)`);
      } else {
        certError = errorActive || errorDefault;
        console.error(`[RENTRI-RESULT] DEBUG - Nessun certificato trovato:`, {
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
      
      console.error(`[RENTRI-RESULT] DEBUG - Certificati disponibili per org_id ${finalOrgId}:`, {
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
    
    console.log(`[RENTRI-RESULT] DEBUG - Certificato trovato:`, {
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
    
    // 3. GET result transazione
    const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/${transazioneId}/result`;
    
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

