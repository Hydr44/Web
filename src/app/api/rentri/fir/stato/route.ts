/**
 * API Route: Leggi Stato FIR da RENTRI
 * GET /api/rentri/fir/stato?fir_id=xxx
 * 
 * Legge lo stato attuale di un FIR da RENTRI e aggiorna il DB locale
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { mapRentriStatoToLocal } from "@/lib/rentri/fir-builder";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fir_id = searchParams.get("fir_id");
    
    if (!fir_id) {
      return NextResponse.json(
        { error: "fir_id mancante" },
        { status: 400 }
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
        { status: 404 }
      );
    }
    
    // Se non ha rentri_numero, non è stato trasmesso
    if (!fir.rentri_numero) {
      return NextResponse.json({
        stato_locale: fir.stato,
        rentri_stato: null,
        message: "FIR non ancora trasmesso a RENTRI"
      });
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
        { status: 404 }
      );
    }
    
    // 3. Genera JWT
    const jwt = await generateRentriJWTDynamic({
      issuer: cert.cf_operatore,
      certificatePem: cert.certificate_pem,
      privateKeyPem: cert.private_key_pem,
      audience: fir.environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
    });
    
    // 4. GET stato da RENTRI
    const rentriUrl = fir.environment === "demo"
      ? `https://rentri-test.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}`
      : `https://rentri-prod.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}`;
    
    const rentriResponse = await fetch(rentriUrl, {
      method: "GET",
      headers: {
        "Agid-JWT-Signature": jwt
      }
    });
    
    if (!rentriResponse.ok) {
      const error = await rentriResponse.json();
      return NextResponse.json(
        { error: "Errore lettura stato RENTRI", rentri_error: error },
        { status: rentriResponse.status }
      );
    }
    
    const rentriData = await rentriResponse.json();
    
    // 5. Mappa stato RENTRI → locale
    const nuovoStatoLocale = mapRentriStatoToLocal(rentriData.stato);
    
    // 6. Aggiorna DB se stato è cambiato
    if (nuovoStatoLocale !== fir.stato || rentriData.stato !== fir.rentri_stato) {
      await supabase
        .from("rentri_formulari")
        .update({
          stato: nuovoStatoLocale,
          rentri_stato: rentriData.stato,
          sync_at: new Date().toISOString()
        })
        .eq("id", fir_id);
      
      console.log("[RENTRI-FIR-STATO] Stato aggiornato:", {
        fir_id,
        old_stato: fir.stato,
        new_stato: nuovoStatoLocale,
        rentri_stato: rentriData.stato
      });
    }
    
    return NextResponse.json({
      success: true,
      stato_locale: nuovoStatoLocale,
      rentri_stato: rentriData.stato,
      stato_changed: nuovoStatoLocale !== fir.stato,
      rentri_data: rentriData
    });
    
  } catch (error: any) {
    console.error("[RENTRI-FIR-STATO] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500 }
    );
  }
}

