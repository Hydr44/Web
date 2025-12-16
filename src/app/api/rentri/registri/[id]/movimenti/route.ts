/**
 * API Route: Trasmetti Movimenti Registro a RENTRI
 * POST /api/rentri/registri/[id]/movimenti
 * 
 * Trasmette movimenti di un registro alle API RENTRI
 * Pattern asincrono NONBLOCK_PULL_REST
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildRentriMovimentoPayload, validateMovimentoForRentri } from "@/lib/rentri/movimento-builder";
import { generateRentriJWTDynamic, generateRentriJWTIntegrity } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";
import { createHash } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENTRI_BASE_URL = process.env.RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { movimenti_ids } = await request.json();
    const registroId = params.id;
    
    if (!registroId) {
      return NextResponse.json(
        { error: "registro_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!movimenti_ids || !Array.isArray(movimenti_ids) || movimenti_ids.length === 0) {
      return NextResponse.json(
        { error: "movimenti_ids deve essere un array non vuoto" },
        { status: 400, headers }
      );
    }
    
    // Max 1000 movimenti per chiamata (limite RENTRI)
    if (movimenti_ids.length > 1000) {
      return NextResponse.json(
        { error: "Massimo 1000 movimenti per trasmissione" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Carica registro dal database
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("*")
      .eq("id", registroId)
      .single();
    
    if (registroError || !registro) {
      return NextResponse.json(
        { error: "Registro non trovato", details: registroError },
        { status: 404, headers }
      );
    }
    
    if (!registro.rentri_id) {
      return NextResponse.json(
        { error: "Registro non ha identificativo RENTRI (deve essere creato su RENTRI prima)" },
        { status: 400, headers }
      );
    }
    
    // 2. Carica movimenti da trasmettere
    const { data: movimenti, error: movimentiError } = await supabase
      .from("rentri_movimenti")
      .select("*")
      .eq("registro_id", registroId)
      .in("id", movimenti_ids)
      .in("sync_status", ["pending", "error"]); // Solo movimenti non ancora trasmessi o con errore
    
    if (movimentiError || !movimenti || movimenti.length === 0) {
      return NextResponse.json(
        { error: "Nessun movimento valido trovato per la trasmissione", details: movimentiError },
        { status: 404, headers }
      );
    }
    
    // 3. Carica certificato RENTRI
    const { data: cert, error: certError } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", registro.org_id)
      .eq("environment", registro.environment || "demo")
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
    
    // 4. Valida e costruisci payload movimenti
    const payloadMovimenti: any[] = [];
    const erroriValidazione: any[] = [];
    
    for (const movimento of movimenti) {
      const validation = validateMovimentoForRentri(movimento as any);
      if (!validation.valid) {
        erroriValidazione.push({
          movimento_id: movimento.id,
          errori: validation.errors
        });
        continue;
      }
      
      const movimentoPayload = buildRentriMovimentoPayload(movimento as any);
      payloadMovimenti.push(movimentoPayload);
    }
    
    if (payloadMovimenti.length === 0) {
      return NextResponse.json(
        { 
          error: "Nessun movimento valido dopo validazione",
          errori_validazione: erroriValidazione
        },
        { status: 400, headers }
      );
    }
    
    // 5. Genera JWT per autenticazione RENTRI
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: registro.environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
    });
    
    // 6. Prepara body e calcola Digest
    const bodyString = JSON.stringify(payloadMovimenti);
    const bodyHash = createHash('sha256').update(bodyString).digest('base64');
    const digest = `SHA-256=${bodyHash}`;
    
    // 7. Genera JWT per integrità messaggio
    const jwtIntegrity = await generateRentriJWTIntegrity(
      {
        issuer: cert.cf_operatore,
        certificatePem: cert.certificate_pem,
        privateKeyPem: cert.private_key_pem,
        audience: registro.environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
      },
      {
        digest: digest,
        contentType: "application/json"
      }
    );
    
    console.log(`[RENTRI-REGISTRI] Trasmissione ${payloadMovimenti.length} movimenti per registro ${registro.rentri_id}...`);
    
    // 8. POST a RENTRI API
    const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/operatore/${registro.rentri_id}/movimenti`;
    
    let rentriResponse;
    let rentriData;
    let lastError;
    
    // Retry fino a 3 volte
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[RENTRI-REGISTRI] Tentativo ${attempt}/3...`);
        
        const fetchHeaders: Record<string, string> = {
          "Authorization": `Bearer ${jwtAuth}`,
          "Agid-JWT-Signature": jwtIntegrity,
          "Digest": digest,
          "Content-Type": "application/json"
        };
        
        rentriResponse = await fetch(rentriUrl, {
          method: "POST",
          headers: fetchHeaders,
          body: bodyString,
          signal: AbortSignal.timeout(30000)
        });
        
        rentriData = await rentriResponse.json();
        
        if (rentriResponse.ok) {
          console.log(`[RENTRI-REGISTRI] Successo al tentativo ${attempt}`);
          break;
        }
        
        lastError = rentriData;
        
        // Se errore 4xx, non ritentare
        if (rentriResponse.status >= 400 && rentriResponse.status < 500) {
          console.error(`[RENTRI-REGISTRI] Errore client (${rentriResponse.status}), non ritento`);
          break;
        }
        
        // Se 5xx, attendi e riprova
        if (attempt < 3) {
          const delayMs = attempt * 1000;
          console.log(`[RENTRI-REGISTRI] Errore server, attendo ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error: any) {
        lastError = error;
        console.error(`[RENTRI-REGISTRI] Errore tentativo ${attempt}:`, error.message);
        
        if (attempt < 3) {
          const delayMs = attempt * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    if (!rentriResponse || !rentriResponse.ok) {
      // Aggiorna movimenti con errore
      await supabase
        .from("rentri_movimenti")
        .update({
          sync_status: "error",
          sync_error: JSON.stringify(lastError),
          sync_at: new Date().toISOString()
        })
        .in("id", movimenti_ids);
      
      return NextResponse.json(
        {
          error: "Errore trasmissione movimenti a RENTRI",
          details: lastError,
          status: rentriResponse?.status
        },
        { status: rentriResponse?.status || 500, headers }
      );
    }
    
    // 9. Estrai transazione_id dalla risposta (TransazioneModel.transazione_id)
    const transazioneId = rentriData?.transazione_id;
    
    if (!transazioneId) {
      return NextResponse.json(
        { error: "RENTRI non ha restituito transazione_id", response: rentriData },
        { status: 500, headers }
      );
    }
    
    // 10. Aggiorna movimenti con transazione_id e stato
    await supabase
      .from("rentri_movimenti")
      .update({
        sync_status: "in_trasmissione",
        sync_at: new Date().toISOString(),
        sync_error: null
      })
      .in("id", movimenti_ids);
    
    // Salva transazione per tracking
    // TODO: Creare tabella rentri_transazioni se necessario
    
    console.log(`[RENTRI-REGISTRI] Movimenti trasmessi! Transazione ID: ${transazioneId}`);
    
    return NextResponse.json(
      {
        success: true,
        transazione_id: transazioneId,
        movimenti_trasmessi: payloadMovimenti.length,
        location: rentriResponse.headers.get("Location"), // URL per polling status
        errori_validazione: erroriValidazione.length > 0 ? erroriValidazione : undefined
      },
      { status: 202, headers } // 202 Accepted (pattern asincrono)
    );
    
  } catch (error: any) {
    console.error("[RENTRI-REGISTRI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

