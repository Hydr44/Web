/**
 * API Route: Alert Limiti Rifiuti
 * GET /api/rentri/limiti/alert - Recupera limiti con alert (warning/critical)
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
 * GET /api/rentri/limiti/alert
 * Recupera limiti con alert (warning/critical) per organizzazione/anno
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get('org_id');
    const anno = searchParams.get('anno');

    if (!org_id || !anno) {
      return NextResponse.json(
        { error: "org_id e anno sono parametri obbligatori." },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Recupera tutti i limiti per l'organizzazione e anno
    const { data: limiti, error } = await supabase
      .from("rentri_limiti_rifiuti")
      .select("*")
      .eq("org_id", org_id)
      .eq("anno", Number.parseInt(anno));

    if (error) {
      console.error("[RENTRI-LIMITI-ALERT] Errore lettura limiti:", error);
      return NextResponse.json(
        { error: "Errore lettura limiti", details: error.message },
        { status: 500, headers }
      );
    }

    // Calcola percentuale utilizzo e filtra solo quelli con alert
    const limitiConAlert = (limiti || [])
      .map(limite => {
        const percentuale = limite.limite_quantita > 0
          ? (limite.quantita_attuale / limite.limite_quantita) * 100
          : 0;
        
        const superato = percentuale >= 100;
        const warning = percentuale >= (limite.soglia_alert_percentuale || 80) && !superato && percentuale < 95;
        const critical = percentuale >= 95 && !superato;

        return {
          ...limite,
          percentuale_utilizzo: percentuale,
          alert_dovuto: warning || critical || superato,
          superato,
          warning,
          critical
        };
      })
      .filter(l => l.alert_dovuto);

    return NextResponse.json(
      {
        success: true,
        limiti: limitiConAlert,
        count: limitiConAlert.length
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-LIMITI-ALERT] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

