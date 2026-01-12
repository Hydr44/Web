/**
 * API Route: Gestione Limiti Rifiuti
 * GET /api/rentri/limiti - Lista limiti
 * POST /api/rentri/limiti - Crea/aggiorna limite
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

/**
 * GET /api/rentri/limiti
 * Lista limiti per organizzazione/anno
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get('org_id');
    const anno = searchParams.get('anno');

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id richiesto" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("rentri_limiti_rifiuti")
      .select("*")
      .eq("org_id", org_id)
      .order("anno", { ascending: false })
      .order("codice_eer", { ascending: true, nullsLast: true });

    if (anno) {
      query = query.eq("anno", parseInt(anno));
    }

    const { data: limiti, error } = await query;

    if (error) {
      console.error("[RENTRI-LIMITI] Errore lettura limiti:", error);
      return NextResponse.json(
        { error: "Errore lettura limiti", details: error.message },
        { status: 500, headers }
      );
    }

    // Calcola percentuale utilizzo e stato alert
    const limitiConUtilizzo = (limiti || []).map(limite => {
      const percentuale = limite.limite_quantita > 0 
        ? (limite.quantita_attuale / limite.limite_quantita) * 100 
        : 0;
      const superato = limite.quantita_attuale > limite.limite_quantita;
      const alert_dovuto = percentuale >= limite.soglia_alert_percentuale;

      return {
        ...limite,
        percentuale_utilizzo: Math.round(percentuale * 100) / 100,
        superato,
        alert_dovuto
      };
    });

    return NextResponse.json(
      {
        success: true,
        limiti: limitiConUtilizzo,
        count: limitiConUtilizzo.length
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-LIMITI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * POST /api/rentri/limiti
 * Crea o aggiorna limite
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const { org_id, anno, codice_eer, limite_quantita, unita_misura, soglia_alert_percentuale, note } = body;

    if (!org_id || !anno || !limite_quantita) {
      return NextResponse.json(
        { error: "org_id, anno e limite_quantita richiesti" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert limite
    const { data: limite, error } = await supabase
      .from("rentri_limiti_rifiuti")
      .upsert({
        org_id,
        anno: parseInt(anno),
        codice_eer: codice_eer || null,
        limite_quantita: parseFloat(limite_quantita),
        unita_misura: unita_misura || 'kg',
        soglia_alert_percentuale: soglia_alert_percentuale || 80,
        note: note || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'org_id,anno,codice_eer'
      })
      .select()
      .single();

    if (error) {
      console.error("[RENTRI-LIMITI] Errore salvataggio limite:", error);
      return NextResponse.json(
        { error: "Errore salvataggio limite", details: error.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        limite
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-LIMITI] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

