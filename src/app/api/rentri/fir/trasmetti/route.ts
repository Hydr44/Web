/**
 * API Route: Trasmetti FIR a RENTRI
 * POST /api/rentri/fir/trasmetti
 * 
 * Trasmette un formulario locale alle API RENTRI
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildRentriFIRPayload, validateFIRForRentri, mapRentriStatoToLocal } from "@/lib/rentri/fir-builder";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  try {
    const { fir_id } = await request.json();
    
    if (!fir_id) {
      return NextResponse.json(
        { error: "fir_id mancante" },
        { status: 400, headers }
      );
    }
    
    // Supabase client con service role (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Carica FIR dal database
    const { data: fir, error: firError } = await supabase
      .from("rentri_formulari")
      .select("*")
      .eq("id", fir_id)
      .single();
    
    if (firError || !fir) {
      return NextResponse.json(
        { error: "FIR non trovato", details: firError },
        { status: 404, headers }
      );
    }
    
    // 2. Valida FIR prima di trasmettere
    const validation = validateFIRForRentri(fir);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: "FIR non valido per trasmissione",
          validation_errors: validation.errors
        },
        { status: 400, headers }
      );
    }
    
    // 3. Carica certificato attivo per questa org
    const { data: cert, error: certError } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", fir.org_id)
      .eq("environment", fir.environment || "demo")
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();
    
    if (certError || !cert) {
      return NextResponse.json(
        { error: "Certificato RENTRI non trovato per questa organizzazione" },
        { status: 404, headers }
      );
    }
    
    // Verifica scadenza certificato
    const expiresAt = new Date(cert.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Certificato RENTRI scaduto" },
        { status: 400, headers }
      );
    }
    
    // 4. Genera JWT per autenticazione RENTRI
    const jwt = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: fir.environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
    });
    
    // 5. Costruisci payload RENTRI
    const rentriPayload = buildRentriFIRPayload(fir, cert.cf_operatore);
    
    console.log("[RENTRI-FIR] Trasmissione FIR:", {
      fir_id,
      org_id: fir.org_id,
      cf_operatore: cert.cf_operatore,
      numero_fir: fir.numero_fir
    });
    
    // 6. POST a RENTRI API con retry
    // OPZIONE: Gateway mTLS (certificati gestiti da Nginx, NO JWT)
    const useGateway = true;
    
    const rentriUrl = useGateway
      ? (fir.environment === "demo" 
          ? "https://rentri-test.rescuemanager.eu/formulari/v1.0/"
          : "https://rentri-prod.rescuemanager.eu/formulari/v1.0/")
      : (fir.environment === "demo"
          ? "https://demoapi.rentri.gov.it/formulari/v1.0/"
          : "https://api.rentri.gov.it/formulari/v1.0/");
    
    let rentriResponse;
    let rentriData;
    let lastError;
    
    // Prepara body
    const bodyString = JSON.stringify(rentriPayload);
    
    // Calcola Digest SHA-256 del body (pattern AgID INTEGRITY_REST_01)
    const crypto = require('crypto');
    const bodyHash = crypto.createHash('sha256').update(bodyString).digest('base64');
    const digest = `SHA-256=${bodyHash}`;
    
    console.log('[RENTRI-FIR] Digest calcolato:', digest.substring(0, 50) + '...');
    
    // Retry fino a 3 volte con backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[RENTRI-FIR] Tentativo ${attempt}/3...`);
        
        // Se uso gateway mTLS, Nginx gestisce i certificati, NO JWT/Digest
        // Se chiamo API dirette, serve JWT + Digest
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };
        
        if (!useGateway) {
          // Chiamata diretta: serve autenticazione JWT completa
          headers["Authorization"] = `Bearer ${jwt}`;
          headers["Agid-JWT-Signature"] = jwt;
          headers["Digest"] = digest;
        }
        // Se uso gateway: Nginx gestisce mTLS con certificati, nessun header JWT
        
        console.log('[RENTRI-FIR] Usando gateway:', useGateway, 'Headers:', Object.keys(headers));
        
        rentriResponse = await fetch(rentriUrl, {
          method: "POST",
          headers,
          body: bodyString,
          signal: AbortSignal.timeout(30000) // 30s timeout
        });
        
        rentriData = await rentriResponse.json();
        
        if (rentriResponse.ok) {
          console.log(`[RENTRI-FIR] Successo al tentativo ${attempt}`);
          break; // Successo, esci dal loop
        }
        
        lastError = rentriData;
        
        // Se errore 4xx (client error), non ritentare
        if (rentriResponse.status >= 400 && rentriResponse.status < 500) {
          console.error(`[RENTRI-FIR] Errore client (${rentriResponse.status}), non ritento`);
          break;
        }
        
        // Se 5xx (server error), attendi e riprova
        if (attempt < 3) {
          const delayMs = attempt * 1000; // 1s, 2s
          console.log(`[RENTRI-FIR] Errore server, attendo ${delayMs}ms prima di ritentare...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error: any) {
        console.error(`[RENTRI-FIR] Errore tentativo ${attempt}:`, error);
        lastError = error;
        
        if (attempt < 3) {
          const delayMs = attempt * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    if (!rentriResponse.ok) {
      console.error("[RENTRI-FIR] Errore RENTRI:", rentriData);
      
      // Salva errore nel DB
      await supabase
        .from("rentri_formulari")
        .update({
          sync_status: "error",
          sync_error: JSON.stringify(rentriData),
          sync_at: new Date().toISOString()
        })
        .eq("id", fir_id);
      
      return NextResponse.json(
        { 
          error: "Errore trasmissione RENTRI",
          rentri_error: rentriData
        },
        { status: rentriResponse.status, headers }
      );
    }
    
    // 7. Salva risposta RENTRI nel DB
    const statoLocale = mapRentriStatoToLocal(rentriData.stato || "InserimentoQuantita");
    
    const { error: updateError } = await supabase
      .from("rentri_formulari")
      .update({
        stato: statoLocale,
        rentri_id: rentriData.id || rentriData.identificativo,
        rentri_numero: rentriData.numero_fir,
        rentri_stato: rentriData.stato,
        sync_status: "synced",
        sync_at: new Date().toISOString(),
        sync_error: null
      })
      .eq("id", fir_id);
    
    if (updateError) {
      console.error("[RENTRI-FIR] Errore update DB:", updateError);
    }
    
    console.log("[RENTRI-FIR] Trasmissione completata:", {
      rentri_id: rentriData.id,
      numero_fir: rentriData.numero_fir,
      stato: rentriData.stato
    });
    
    return NextResponse.json({
      success: true,
      rentri_id: rentriData.id,
      numero_fir: rentriData.numero_fir,
      stato_rentri: rentriData.stato,
      stato_locale: statoLocale,
      message: "FIR trasmesso con successo a RENTRI"
    }, { headers });
    
  } catch (error: any) {
    console.error("[RENTRI-FIR] Errore trasmissione:", error);
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500, headers }
    );
  }
}

