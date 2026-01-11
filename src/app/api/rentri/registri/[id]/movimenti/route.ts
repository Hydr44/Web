/**
 * API Route: CRUD Movimenti Registro (Locale)
 * GET /api/rentri/registri/[id]/movimenti - Lista movimenti
 * POST /api/rentri/registri/[id]/movimenti - Crea movimento locale
 * 
 * Per trasmettere a RENTRI: POST /api/rentri/registri/[id]/movimenti/sync
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleCors, corsHeaders } from "@/lib/cors";
import { buildRentriMovimentoPayload, validateMovimentoForRentri } from "@/lib/rentri/movimento-builder";
import { generateRentriJWTDynamic, generateRentriJWTIntegrity } from "@/lib/rentri/jwt-dynamic";
import { createHash } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENTRI_BASE_URL = process.env.RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

/**
 * GET /api/rentri/registri/[id]/movimenti
 * Lista movimenti di un registro con filtri
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { id: registroId } = params;
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('org_id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verifica che il registro esista e appartenga all'org
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("id")
      .eq("id", registroId)
      .eq("org_id", orgId)
      .single();
    
    if (registroError || !registro) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    // Costruisci query movimenti con filtri
    let query = supabase
      .from("rentri_movimenti")
      .select("*")
      .eq("registro_id", registroId)
      .eq("org_id", orgId)
      .order("data_operazione", { ascending: false })
      .order("progressivo", { ascending: false });
    
    // Filtri opzionali
    const dataFrom = searchParams.get('data_from');
    if (dataFrom) {
      query = query.gte('data_operazione', dataFrom);
    }
    
    const dataTo = searchParams.get('data_to');
    if (dataTo) {
      query = query.lte('data_operazione', dataTo);
    }
    
    const tipo = searchParams.get('tipo');
    if (tipo) {
      query = query.eq('tipo_operazione', tipo);
    }
    
    const codiceEER = searchParams.get('codice_eer');
    if (codiceEER) {
      query = query.eq('codice_eer', codiceEER);
    }
    
    const { data: movimenti, error } = await query;
    
    if (error) {
      console.error("[RENTRI-MOVIMENTI] Errore lettura movimenti:", error);
      return NextResponse.json(
        { error: "Errore lettura movimenti", details: error.message },
        { status: 500, headers }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        movimenti: movimenti || [],
        count: movimenti?.length || 0
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-MOVIMENTI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * POST /api/rentri/registri/[id]/movimenti
 * Crea movimento in DB locale (non sincronizza con RENTRI)
 * Per sincronizzazione: POST /api/rentri/registri/[id]/movimenti/trasmetti
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const body = await request.json();
    const { org_id, movimenti_ids } = body;
    
    const registroId = params.id;
    
    if (!registroId) {
      return NextResponse.json(
        { error: "registro_id mancante" },
        { status: 400, headers }
      );
    }
    
    // Se contiene movimenti_ids, è una richiesta di sincronizzazione con RENTRI
    if (movimenti_ids && Array.isArray(movimenti_ids)) {
      // === SINCRONIZZAZIONE CON RENTRI ===
      
      if (!org_id) {
        return NextResponse.json(
          { error: "org_id mancante" },
          { status: 400, headers }
        );
      }
      
      if (movimenti_ids.length === 0) {
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
    
    // 3. Carica certificato RENTRI (prima prova con is_default, poi senza)
    let cert = null;
    let certError = null;
    
    // Prova prima con is_default = true
    const { data: certDefault, error: errorDefault } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", registro.org_id)
      .eq("environment", registro.environment || "demo")
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();
    
    if (certDefault) {
      cert = certDefault;
    } else {
      // Se non trovato, prendi il primo certificato attivo
      const { data: certActive, error: errorActive } = await supabase
        .from("rentri_org_certificates")
        .select("*")
        .eq("org_id", registro.org_id)
        .eq("environment", registro.environment || "demo")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (certActive) {
        cert = certActive;
      } else {
        certError = errorActive || errorDefault;
      }
    }
    
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
      console.log(`[RENTRI-MOVIMENTI] Validazione movimento: ${movimento.id}, EER: ${movimento.codice_eer}, Causale: ${movimento.causale_operazione}`);
      const validation = validateMovimentoForRentri(movimento as any);
      if (!validation.valid) {
        erroriValidazione.push({
          movimento_id: movimento.id,
          codice_eer: movimento.codice_eer,
          causale_operazione: movimento.causale_operazione,
          progressivo: movimento.progressivo,
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
    
    // Log payload per debug (solo per causale M con materiali)
    if (payloadMovimenti.some((m: any) => m.materiali)) {
      console.log("[RENTRI-MOVIMENTI] Payload materiali:", JSON.stringify(payloadMovimenti, null, 2));
    }
    
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
        
        // Log dettagliato dell'errore per debug
        console.error(`[RENTRI-REGISTRI] Errore dettagliato:`, JSON.stringify(rentriData, null, 2));
        
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
      
      // Prepara messaggio errore dettagliato
      const errorDetails = {
        status: rentriResponse?.status,
        statusText: rentriResponse?.statusText,
        rentri_error: lastError,
        movimenti_trasmessi: payloadMovimenti.length,
        movimenti_totali: movimenti.length
      };
      
      console.error("[RENTRI-MOVIMENTI] Errore trasmissione:", errorDetails);
      
      return NextResponse.json(
        {
          error: "Errore trasmissione movimenti a RENTRI",
          details: errorDetails,
          errori_validazione: erroriValidazione.length > 0 ? erroriValidazione : undefined
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
      
    } else {
      // === CRUD LOCALE (Creazione nuovo movimento) ===
      if (!org_id) {
        return NextResponse.json(
          { error: "org_id mancante" },
          { status: 400, headers }
        );
      }
      
      const { ...movimentoData } = body;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: newMovimento, error } = await supabase
        .from("rentri_movimenti")
        .insert({ registro_id: registroId, org_id, ...movimentoData })
        .select()
        .single();
      
      if (error) {
        console.error("[RENTRI-MOVIMENTI] Errore creazione movimento:", error);
        return NextResponse.json(
          { error: "Errore creazione movimento", details: error.message },
          { status: 500, headers }
        );
      }
      
      return NextResponse.json(
        { movimento: newMovimento },
        { status: 201, headers }
      );
    }
    
  } catch (error: any) {
    console.error("[RENTRI-MOVIMENTI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

