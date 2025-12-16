/**
 * API Route: Crea Registro su RENTRI
 * POST /api/rentri/registri/create
 * 
 * Crea un nuovo registro su RENTRI e lo salva nel database locale
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic, generateRentriJWTIntegrity } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENTRI_BASE_URL = process.env.RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  try {
    const { org_id, registro_id } = await request.json();
    
    if (!org_id) {
      return NextResponse.json(
        { error: "org_id mancante" },
        { status: 400, headers }
      );
    }
    
    if (!registro_id) {
      return NextResponse.json(
        { error: "registro_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Recupera registro locale
    const { data: registro, error: registroError } = await supabase
      .from("rentri_registri")
      .select("*")
      .eq("id", registro_id)
      .eq("org_id", org_id)
      .single();
    
    if (registroError || !registro) {
      return NextResponse.json(
        { error: "Registro non trovato" },
        { status: 404, headers }
      );
    }
    
    // 2. Se già ha rentri_id, non creare di nuovo
    if (registro.rentri_id) {
      return NextResponse.json(
        { 
          error: "Registro già creato su RENTRI",
          rentri_id: registro.rentri_id
        },
        { status: 400, headers }
      );
    }
    
    // 3. Recupera certificato RENTRI
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
    
    if (!cert.num_iscr_sito) {
      return NextResponse.json(
        { error: "num_iscr_sito mancante nel certificato. Configura l'unità locale prima di creare registri." },
        { status: 400, headers }
      );
    }
    
    // 4. Prepara payload per RENTRI
    // POST /anagrafiche/v1.0/registri
    // Body: { num_iscr_sito, attivita[], descrizione?, attivita_rec_smalt?[] }
    const payload: any = {
      num_iscr_sito: cert.num_iscr_sito,
      attivita: registro.attivita || ["Produzione"], // Default se non specificato
      descrizione: registro.descrizione || null
    };
    
    // Attività recupero/smaltimento (se presente)
    if (registro.attivita_rec_smalt && Array.isArray(registro.attivita_rec_smalt) && registro.attivita_rec_smalt.length > 0) {
      payload.attivita_rec_smalt = registro.attivita_rec_smalt;
    }
    
    // 5. Genera JWT per autenticazione e integrità
    const jwtAuth = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: 'rentrigov.demo.api',
    });
    
    const jwtIntegrity = await generateRentriJWTIntegrity({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: 'rentrigov.demo.api',
      body: JSON.stringify(payload)
    });
    
    // 6. Chiama RENTRI per creare registro
    const rentriUrl = `${RENTRI_BASE_URL}/anagrafiche/v1.0/registri`;
    
    console.log(`[RENTRI-REGISTRI] Creazione registro su RENTRI per ${cert.num_iscr_sito}...`);
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwtAuth}`,
        "Agid-JWT-Signature": jwtIntegrity,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!rentriResponse.ok) {
      const errorData = await rentriResponse.json().catch(() => ({}));
      console.error("[RENTRI-REGISTRI] Errore creazione registro su RENTRI:", errorData);
      return NextResponse.json(
        {
          error: "Errore creazione registro su RENTRI",
          status: rentriResponse.status,
          details: errorData
        },
        { status: rentriResponse.status, headers }
      );
    }
    
    const createResponse = await rentriResponse.json();
    const rentri_id = createResponse.identificativo;
    
    if (!rentri_id) {
      return NextResponse.json(
        { error: "RENTRI non ha restituito identificativo registro" },
        { status: 500, headers }
      );
    }
    
    console.log(`[RENTRI-REGISTRI] Registro creato su RENTRI: ${rentri_id}`);
    
    // 7. Aggiorna registro locale con rentri_id
    const { error: updateError } = await supabase
      .from("rentri_registri")
      .update({
        rentri_id: rentri_id,
        sync_status: "synced",
        sync_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", registro_id);
    
    if (updateError) {
      console.error("[RENTRI-REGISTRI] Errore aggiornamento registro locale:", updateError);
      // Non fallire, il registro è stato creato su RENTRI
    }
    
    return NextResponse.json(
      {
        success: true,
        rentri_id: rentri_id,
        registro_id: registro_id,
        message: "Registro creato con successo su RENTRI"
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

