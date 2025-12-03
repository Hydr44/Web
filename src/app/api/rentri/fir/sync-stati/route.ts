/**
 * API Route: Sync Stati FIR da RENTRI (Cron Job)
 * GET /api/rentri/fir/sync-stati
 * 
 * Polling automatico degli stati FIR trasmessi a RENTRI
 * Da chiamare ogni 5 minuti con cron (Vercel Cron o esterno)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRentriJWTDynamic } from "@/lib/rentri/jwt-dynamic";
import { mapRentriStatoToLocal } from "@/lib/rentri/fir-builder";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Verifica authorization (cron secret)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret-change-in-prod";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("[RENTRI-SYNC] Inizio sync stati FIR...");
    
    // 1. Carica tutti i FIR trasmessi (non ancora accettati/rifiutati/annullati)
    const { data: firs, error: firsError } = await supabase
      .from("rentri_formulari")
      .select("id, org_id, rentri_numero, rentri_stato, stato, environment")
      .not("rentri_numero", "is", null)
      .in("stato", ["trasmesso"]) // Solo quelli in attesa
      .limit(50); // Max 50 per run
    
    if (firsError) {
      console.error("[RENTRI-SYNC] Errore caricamento FIR:", firsError);
      return NextResponse.json(
        { error: "Errore caricamento FIR", details: firsError },
        { status: 500 }
      );
    }
    
    if (!firs || firs.length === 0) {
      console.log("[RENTRI-SYNC] Nessun FIR da sincronizzare");
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "Nessun FIR da sincronizzare"
      });
    }
    
    console.log(`[RENTRI-SYNC] Trovati ${firs.length} FIR da sincronizzare`);
    
    // 2. Raggruppa FIR per org (per riutilizzare certificati)
    const firsByOrg = firs.reduce((acc, fir) => {
      if (!acc[fir.org_id]) acc[fir.org_id] = [];
      acc[fir.org_id].push(fir);
      return acc;
    }, {} as Record<string, typeof firs>);
    
    let syncedCount = 0;
    let errorCount = 0;
    const results = [];
    
    // 3. Per ogni org, carica certificato e sync FIR
    for (const [org_id, orgFirs] of Object.entries(firsByOrg)) {
      try {
        // Carica certificato org
        const environment = orgFirs[0].environment || "demo";
        
        const { data: cert } = await supabase
          .from("rentri_org_certificates")
          .select("*")
          .eq("org_id", org_id)
          .eq("environment", environment)
          .eq("is_active", true)
          .eq("is_default", true)
          .maybeSingle();
        
        if (!cert) {
          console.warn(`[RENTRI-SYNC] Certificato non trovato per org ${org_id}`);
          errorCount += orgFirs.length;
          continue;
        }
        
        // Genera JWT
        const jwt = await generateRentriJWTDynamic({
          issuer: cert.cf_operatore,
          certificatePem: cert.certificate_pem,
          privateKeyPem: cert.private_key_pem,
          audience: environment === "demo" ? "rentrigov.demo.api" : "rentrigov.api"
        });
        
        // Sync ogni FIR di questa org
        for (const fir of orgFirs) {
          try {
            const rentriUrl = environment === "demo"
              ? `https://rentri-test.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}`
              : `https://rentri-prod.rescuemanager.eu/formulari/v1.0/${fir.rentri_numero}`;
            
            const response = await fetch(rentriUrl, {
              method: "GET",
              headers: { "Authorization": `Bearer ${jwt}` },
              signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
              console.warn(`[RENTRI-SYNC] Errore GET FIR ${fir.rentri_numero}:`, response.status);
              errorCount++;
              continue;
            }
            
            const rentriData = await response.json();
            const nuovoStatoLocale = mapRentriStatoToLocal(rentriData.stato);
            
            // Aggiorna solo se cambiato
            if (nuovoStatoLocale !== fir.stato || rentriData.stato !== fir.rentri_stato) {
              await supabase
                .from("rentri_formulari")
                .update({
                  stato: nuovoStatoLocale,
                  rentri_stato: rentriData.stato,
                  sync_at: new Date().toISOString(),
                  sync_status: "synced"
                })
                .eq("id", fir.id);
              
              console.log(`[RENTRI-SYNC] FIR ${fir.rentri_numero} aggiornato:`, {
                old: fir.stato,
                new: nuovoStatoLocale,
                rentri: rentriData.stato
              });
              
              syncedCount++;
              results.push({
                fir_id: fir.id,
                numero_fir: fir.rentri_numero,
                old_stato: fir.stato,
                new_stato: nuovoStatoLocale,
                rentri_stato: rentriData.stato
              });
            }
            
          } catch (error: any) {
            console.error(`[RENTRI-SYNC] Errore sync FIR ${fir.rentri_numero}:`, error);
            errorCount++;
          }
        }
        
      } catch (error: any) {
        console.error(`[RENTRI-SYNC] Errore org ${org_id}:`, error);
        errorCount += orgFirs.length;
      }
    }
    
    console.log(`[RENTRI-SYNC] Completato: ${syncedCount} aggiornati, ${errorCount} errori`);
    
    return NextResponse.json({
      success: true,
      total_checked: firs.length,
      synced: syncedCount,
      errors: errorCount,
      results
    });
    
  } catch (error: any) {
    console.error("[RENTRI-SYNC] Errore generale:", error);
    return NextResponse.json(
      { error: "Errore interno server", details: error.message },
      { status: 500 }
    );
  }
}

