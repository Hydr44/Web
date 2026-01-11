/**
 * API Route: Aggiorna stato movimenti dopo polling RENTRI
 * POST /api/rentri/movimenti/update-status
 * 
 * Chiamato dal server VPS dopo aver ricevuto il risultato da RENTRI
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
    const body = await request.json();
    const { registro_id, org_id, transazione_id, esito } = body;
    
    if (!registro_id || !org_id || !transazione_id) {
      return NextResponse.json(
        { error: "registro_id, org_id e transazione_id richiesti" },
        { status: 400, headers }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Trova tutti i movimenti con questo registro_id e org_id in stato in_trasmissione
    const { data: movimenti, error: movError } = await supabase
      .from("rentri_movimenti")
      .select("id")
      .eq("registro_id", registro_id)
      .eq("org_id", org_id)
      .eq("sync_status", "in_trasmissione");
    
    if (movError) {
      console.error("[RENTRI-UPDATE-STATUS] Errore ricerca movimenti:", movError);
      return NextResponse.json(
        { error: "Errore ricerca movimenti", details: movError.message },
        { status: 500, headers }
      );
    }
    
    if (!movimenti || movimenti.length === 0) {
      console.log("[RENTRI-UPDATE-STATUS] Nessun movimento trovato in stato in_trasmissione");
      return NextResponse.json(
        { success: true, message: "Nessun movimento da aggiornare", movimenti_aggiornati: 0 },
        { status: 200, headers }
      );
    }
    
    // Estrai identificativi da numero_registrazioni se disponibili
    const identificativi: string[] = [];
    if (esito && esito.numero_registrazioni && Array.isArray(esito.numero_registrazioni)) {
      esito.numero_registrazioni.forEach((reg: any) => {
        if (reg.identificativo) identificativi.push(reg.identificativo);
      });
    }
    
    // Aggiorna tutti i movimenti
    const updateData: any = {
      sync_status: "trasmesso",
      rentri_stato: "validato",
      sync_at: new Date().toISOString(),
      sync_error: null
    };
    
    // Se ci sono identificativi e corrispondono al numero di movimenti, aggiorna con identificativi specifici
    if (identificativi.length > 0 && identificativi.length === movimenti.length) {
      // Aggiorna con identificativi specifici
      const updates = movimenti.map((mov, index) => ({
        id: mov.id,
        ...updateData,
        rentri_id: identificativi[index]
      }));
      
      for (const update of updates) {
        await supabase
          .from("rentri_movimenti")
          .update({
            sync_status: update.sync_status,
            rentri_stato: update.rentri_stato,
            rentri_id: update.rentri_id,
            sync_at: update.sync_at,
            sync_error: update.sync_error
          })
          .eq("id", update.id);
      }
      
      console.log(`[RENTRI-UPDATE-STATUS] Aggiornati ${movimenti.length} movimenti con identificativi RENTRI`);
    } else {
      // Aggiorna tutti insieme senza identificativi specifici
      const { error: updateError } = await supabase
        .from("rentri_movimenti")
        .update(updateData)
        .in("id", movimenti.map(m => m.id));
      
      if (updateError) {
        console.error("[RENTRI-UPDATE-STATUS] Errore aggiornamento movimenti:", updateError);
        return NextResponse.json(
          { error: "Errore aggiornamento movimenti", details: updateError.message },
          { status: 500, headers }
        );
      }
      
      console.log(`[RENTRI-UPDATE-STATUS] Aggiornati ${movimenti.length} movimenti a stato trasmesso`);
    }
    
    return NextResponse.json(
      {
        success: true,
        movimenti_aggiornati: movimenti.length,
        transazione_id: transazione_id
      },
      { status: 200, headers }
    );
    
  } catch (error: any) {
    console.error("[RENTRI-UPDATE-STATUS] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

