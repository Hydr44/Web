/**
 * API Route: Inserisci Accettazione FIR su RENTRI
 * POST /api/rentri/fir/accettazione
 * 
 * Il destinatario inserisce i dati di accettazione del rifiuto
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

interface AccettazionePayload {
  fir_id: string;
  tipo_accettazione: "totale" | "parziale" | "respinta";
  quantita_accettata?: number;
  data_arrivo: string;
  note?: string;
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  try {
    const body: AccettazionePayload = await request.json();
    const { fir_id, tipo_accettazione, quantita_accettata, data_arrivo, note } = body;
    
    if (!fir_id || !tipo_accettazione || !data_arrivo) {
      return NextResponse.json(
        { error: "Parametri mancanti (fir_id, tipo_accettazione, data_arrivo)" },
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
      return NextResponse.json(
        { error: "FIR non trasmesso a RENTRI" },
        { status: 400, headers }
      );
    }
    
    // 2. Carica certificato destinatario
    // Nota: Questo dovrebbe essere il certificato del DESTINATARIO, non del produttore
    // Per test, usiamo lo stesso certificato
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
    
    // 4. Costruisci payload accettazione
    const accettazionePayload: any = {
      data_arrivo: new Date(data_arrivo).toISOString(),
      tipo_esito: tipo_accettazione === "totale" ? "AccettatoTotalmente" :
                  tipo_accettazione === "parziale" ? "AccettatoParzialmente" :
                  "Respinto"
    };
    
    if (tipo_accettazione === "parziale" && quantita_accettata) {
      accettazionePayload.quantita_accettata = quantita_accettata;
    }
    
    if (note) {
      accettazionePayload.note = note;
    }
    
    console.log("[RENTRI-ACCETTAZIONE] Inserimento accettazione:", {
      numero_fir: fir.rentri_numero,
      tipo: tipo_accettazione
    });
    
    // 5. POST accettazione a RENTRI
    const rentriUrl = fir.environment === "demo"
      ? `https://rentri-test.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}/accettazione`
      : `https://rentri-prod.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}/accettazione`;
    
    let rentriResponse;
    let rentriData;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        rentriResponse = await fetch(rentriUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jwt}`,
            "Agid-JWT-Signature": jwt,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(accettazionePayload),
          signal: AbortSignal.timeout(30000)
        });
        
        rentriData = await rentriResponse.json();
        if (rentriResponse.ok) break;
        if (rentriResponse.status >= 400 && rentriResponse.status < 500) break;
        if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1000));
        
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }
    
    if (!rentriResponse || !rentriResponse.ok) {
      console.error("[RENTRI-ACCETTAZIONE] Errore RENTRI:", rentriData);
      return NextResponse.json(
        { error: "Errore inserimento accettazione", rentri_error: rentriData },
        { status: rentriResponse?.status || 500, headers }
      );
    }
    
    // 6. Aggiorna DB
    const nuovoStatoLocale = tipo_accettazione === "respinta" ? "rifiutato" :
                             mapRentriStatoToLocal(rentriData.stato || "FirmaAccettazione");
    
    await supabase
      .from("rentri_formulari")
      .update({
        stato: nuovoStatoLocale,
        rentri_stato: rentriData.stato,
        data_fine_trasporto: data_arrivo,
        sync_status: "synced",
        sync_at: new Date().toISOString()
      })
      .eq("id", fir_id);
    
    console.log("[RENTRI-ACCETTAZIONE] Accettazione inserita:", {
      numero_fir: fir.rentri_numero,
      tipo: tipo_accettazione,
      nuovo_stato: rentriData.stato
    });
    
    return NextResponse.json({
      success: true,
      tipo_accettazione,
      stato_rentri: rentriData.stato,
      stato_locale: nuovoStatoLocale,
      message: "Accettazione inserita con successo"
    }, { headers });
    
  } catch (error: any) {
    console.error("[RENTRI-ACCETTAZIONE] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500, headers }
    );
  }
}

