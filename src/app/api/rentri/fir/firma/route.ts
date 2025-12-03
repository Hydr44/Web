/**
 * API Route: Firma FIR su RENTRI
 * POST /api/rentri/fir/firma
 * 
 * Appone firma digitale a un FIR trasmesso a RENTRI
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { mapRentriStatoToLocal } from "@/lib/rentri/fir-builder";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  try {
    const { fir_id, tipo_firma } = await request.json();
    
    if (!fir_id) {
      return NextResponse.json(
        { error: "fir_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Carica FIR dal database
    const { data: fir, error: firError } = await supabase
      .from("rentri_formulari")
      .select("*")
      .eq("id", fir_id)
      .single();
    
    if (firError || !fir) {
      return NextResponse.json(
        { error: "FIR non trovato" },
        { status: 404, headers }
      );
    }
    
    if (!fir.rentri_numero) {
      return NextResponse.json(
        { error: "FIR non ancora trasmesso a RENTRI" },
        { status: 400, headers }
      );
    }
    
    // 2. Carica certificato
    const { data: cert } = await supabase
      .from("rentri_org_certificates")
      .select("*")
      .eq("org_id", fir.org_id)
      .eq("environment", fir.environment || "demo")
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();
    
    if (!cert) {
      return NextResponse.json(
        { error: "Certificato non trovato" },
        { status: 404, headers }
      );
    }
    
    // 3. Genera JWT
    const jwt = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: fir.environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
    });
    
    // 4. Prepara payload firma
    // RENTRI richiede file xFIR firmato con XAdES
    // Per ora usiamo firma JWT (semplificata)
    const firmaPayload = {
      codice_fiscale_firmatario: cert.cf_operatore,
      tipo_firma: tipo_firma || "produttore" // "produttore", "trasportatore", "destinatario"
    };
    
    console.log("[RENTRI-FIRMA] Firma FIR:", {
      numero_fir: fir.rentri_numero,
      tipo_firma: tipo_firma,
      cf: cert.cf_operatore
    });
    
    // 5. POST firma a RENTRI
    const rentriUrl = fir.environment === "demo"
      ? `https://rentri-test.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}/firma`
      : `https://rentri-prod.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}/firma`;
    
    let rentriResponse;
    let rentriData;
    
    // Retry fino a 3 volte
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        rentriResponse = await fetch(rentriUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(firmaPayload),
          signal: AbortSignal.timeout(30000)
        });
        
        rentriData = await rentriResponse.json();
        
        if (rentriResponse.ok) break;
        
        if (rentriResponse.status >= 400 && rentriResponse.status < 500) {
          break; // Errore client, non ritentare
        }
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
        
      } catch (error: any) {
        console.error(`[RENTRI-FIRMA] Errore tentativo ${attempt}:`, error);
        if (attempt === 3) throw error;
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
    if (!rentriResponse || !rentriResponse.ok) {
      console.error("[RENTRI-FIRMA] Errore RENTRI:", rentriData);
      
      await supabase
        .from("rentri_formulari")
        .update({
          sync_status: "error",
          sync_error: JSON.stringify({ firma_error: rentriData }),
          sync_at: new Date().toISOString()
        })
        .eq("id", fir_id);
      
      return NextResponse.json(
        { error: "Errore firma RENTRI", rentri_error: rentriData },
        { status: rentriResponse?.status || 500, headers }
      );
    }
    
    // 6. Aggiorna stato nel DB
    const nuovoStatoLocale = mapRentriStatoToLocal(rentriData.stato);
    
    await supabase
      .from("rentri_formulari")
      .update({
        stato: nuovoStatoLocale,
        rentri_stato: rentriData.stato,
        sync_status: "synced",
        sync_at: new Date().toISOString()
      })
      .eq("id", fir_id);
    
    console.log("[RENTRI-FIRMA] Firma completata:", {
      numero_fir: fir.rentri_numero,
      nuovo_stato: rentriData.stato
    });
    
    return NextResponse.json({
      success: true,
      stato_rentri: rentriData.stato,
      stato_locale: nuovoStatoLocale,
      message: "Firma apposta con successo"
    }, { headers });
    
  } catch (error: any) {
    console.error("[RENTRI-FIRMA] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500, headers }
    );
  }
}

