/**
 * API Route: Sincronizza Registri da RENTRI
 * POST /api/rentri/registri/sync
 * 
 * Recupera i registri da RENTRI e li sincronizza nel database locale
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENTRI_BASE_URL = process.env.RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { org_id, num_iscr_sito } = await request.json();
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!num_iscr_sito) {
      return NextResponse.json(
        { error: "num_iscr_sito mancante (richiesto per recuperare registri da RENTRI)" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Recupera certificato RENTRI per l'organizzazione
    const { data: cert, error: certError } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", org_id)
      .eq("environment", "demo")
      .eq("is_active", true)
      .eq("is_default", true)
      .single();
    
    if (certError || !cert) {
      return NextResponse.json(
        { error: "Certificato RENTRI non trovato per questa organizzazione" },
        { status: 404, headers }
      );
    }
    
    // Estrai num_iscr dal num_iscr_sito (formato: OP123XXXXXXXX00-PD00001)
    const num_iscr = num_iscr_sito.split('-')[0];
    
    if (!num_iscr) {
      return NextResponse.json(
        { error: "num_iscr_sito non valido (formato atteso: OP123XXXXXXXX00-PD00001)" },
        { status: 400, headers }
      );
    }
    
    // 2. Genera JWT per autenticazione RENTRI
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: 'rentrigov.demo.api',
    });
    
    // 3. Chiama RENTRI per recuperare registri
    // GET /anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}/registri
    const rentriUrl = `${RENTRI_BASE_URL}/anagrafiche/v1.0/operatore/${num_iscr}/siti/${num_iscr_sito}/registri`;
    
    console.log(`[RENTRI-REGISTRI] Sincronizzazione registri da RENTRI per ${num_iscr_sito}...`);
    
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
      console.error("[RENTRI-REGISTRI] Errore chiamata RENTRI:", errorData);
      return NextResponse.json(
        {
          error: "Errore recupero registri da RENTRI",
          status: rentriResponse.status,
          details: errorData
        },
        { status: rentriResponse.status, headers }
      );
    }
    
    const registriRentri = await rentriResponse.json();
    
    if (!Array.isArray(registriRentri)) {
      return NextResponse.json(
        { error: "Risposta RENTRI non valida (atteso array)" },
        { status: 500, headers }
      );
    }
    
    console.log(`[RENTRI-REGISTRI] Ricevuti ${registriRentri.length} registri da RENTRI`);
    
    // 4. Per ogni registro, sincronizza nel DB locale
    const registriSincronizzati = [];
    const errori = [];
    
    for (const registroRentri of registriRentri) {
      try {
        const identificativo = registroRentri.identificativo;
        
        if (!identificativo) {
          console.warn("[RENTRI-REGISTRI] Registro senza identificativo, skip:", registroRentri);
          continue;
        }
        
        // Cerca registro locale esistente per rentri_id
        const { data: registroEsistente } = await supabase
          .from("rentri_registri")
          .select("id")
          .eq("org_id", org_id)
          .eq("rentri_id", identificativo)
          .maybeSingle();
        
        // Prepara dati per upsert
        const registroData: any = {
          org_id,
          rentri_id: identificativo,
          descrizione: registroRentri.descrizione || null,
          num_iscr_sito: num_iscr_sito,
          // Estrai anno dalla data_creazione se disponibile
          anno: registroRentri.data_creazione 
            ? new Date(registroRentri.data_creazione).getFullYear()
            : new Date().getFullYear(),
          // Stato basato su data_chiusura
          stato: registroRentri.data_chiusura ? "chiuso" : "attivo",
          sync_status: "synced",
          sync_at: new Date().toISOString(),
          sync_error: null,
          environment: "demo",
          certificate_id: cert.id,
          updated_at: new Date().toISOString()
        };
        
        // Attività (array in RENTRI)
        if (registroRentri.attivita && Array.isArray(registroRentri.attivita) && registroRentri.attivita.length > 0) {
          // Mappa attività a tipo registro se necessario
          // Per ora manteniamo solo le attività come sono
        }
        
        if (registroEsistente) {
          // Update registro esistente
          const { error: updateError } = await supabase
            .from("rentri_registri")
            .update(registroData)
            .eq("id", registroEsistente.id);
          
          if (updateError) throw updateError;
          
          registriSincronizzati.push({
            id: registroEsistente.id,
            rentri_id: identificativo,
            azione: "aggiornato"
          });
        } else {
          // Insert nuovo registro
          registroData.created_at = new Date().toISOString();
          
          const { data: nuovoRegistro, error: insertError } = await supabase
            .from("rentri_registri")
            .insert(registroData)
            .select("id, rentri_id")
            .single();
          
          if (insertError) throw insertError;
          
          registriSincronizzati.push({
            id: nuovoRegistro.id,
            rentri_id: nuovoRegistro.rentri_id,
            azione: "creato"
          });
        }
        
      } catch (error: any) {
        console.error("[RENTRI-REGISTRI] Errore sincronizzazione registro:", error);
        errori.push({
          registro: registroRentri.identificativo || "N/A",
          errore: error.message || String(error)
        });
      }
    }
    
    return NextResponse.json(
      {
        success: true,
        registri_sincronizzati: registriSincronizzati.length,
        registri: registriSincronizzati,
        errori: errori.length > 0 ? errori : undefined,
        totale_da_rentri: registriRentri.length
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-REGISTRI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

