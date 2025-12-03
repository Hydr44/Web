/**
 * API Route: Annulla FIR su RENTRI
 * POST /api/rentri/fir/annulla
 * 
 * Annulla un FIR trasmesso a RENTRI
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  try {
    const { fir_id, motivo } = await request.json();
    
    if (!fir_id) {
      return NextResponse.json(
        { error: "fir_id mancante" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Carica FIR
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
      // FIR solo locale, annulla solo nel DB
      await supabase
        .from("rentri_formulari")
        .update({ stato: "annullato" })
        .eq("id", fir_id);
      
      return NextResponse.json({
        success: true,
        message: "FIR locale annullato"
      }, { headers });
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
    
    // 4. POST annullamento a RENTRI
    const rentriUrl = fir.environment === "demo"
      ? `https://rentri-test.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}/annulla`
      : `https://rentri-prod.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}/annulla`;
    
    const annullaPayload = {
      motivo: motivo || "Annullamento richiesto dall'operatore",
      data_annullamento: new Date().toISOString()
    };
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "POST",
      headers: {
            "Agid-JWT-Signature": jwt,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(annullaPayload),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!rentriResponse.ok) {
      const error = await rentriResponse.json();
      return NextResponse.json(
        { error: "Errore annullamento RENTRI", rentri_error: error },
        { status: rentriResponse.status, headers }
      );
    }
    
    const rentriData = await rentriResponse.json();
    
    // 5. Aggiorna DB
    await supabase
      .from("rentri_formulari")
      .update({
        stato: "annullato",
        rentri_stato: "Annullato",
        sync_status: "synced",
        sync_at: new Date().toISOString()
      })
      .eq("id", fir_id);
    
    console.log("[RENTRI-ANNULLA] FIR annullato:", fir.rentri_numero);
    
    return NextResponse.json({
      success: true,
      stato: "annullato",
      message: "FIR annullato con successo"
    }, { headers });
    
  } catch (error: any) {
    console.error("[RENTRI-ANNULLA] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500, headers }
    );
  }
}

