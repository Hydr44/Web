/**
 * API Route: Gestione MUD (Modello Unico Dichiarazione)
 * GET /api/rentri/mud - Lista MUD
 * POST /api/rentri/mud - Genera nuovo MUD
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
 * GET /api/rentri/mud
 * Lista MUD per organizzazione/anno
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
      .from("rentri_mud")
      .select("*")
      .eq("org_id", org_id)
      .order("anno", { ascending: false })
      .order("created_at", { ascending: false });

    if (anno) {
      query = query.eq("anno", Number.parseInt(anno));
    }

    const { data: mudList, error } = await query;

    if (error) {
      console.error("[RENTRI-MUD] Errore lettura MUD:", error);
      return NextResponse.json(
        { error: "Errore lettura MUD", details: error.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mud: mudList || [],
        count: mudList?.length || 0
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-MUD] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * POST /api/rentri/mud
 * Genera nuovo MUD aggregando dati da movimenti/registri/formulari
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const { org_id, anno, data_inizio, data_fine } = body;

    if (!org_id || !anno) {
      return NextResponse.json(
        { error: "org_id e anno richiesti" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifica se MUD per questo anno esiste già
    const { data: existingMud } = await supabase
      .from("rentri_mud")
      .select("id")
      .eq("org_id", org_id)
      .eq("anno", parseInt(anno))
      .single();

    if (existingMud) {
      return NextResponse.json(
        { error: "MUD per questo anno esiste già", mud_id: existingMud.id },
        { status: 400, headers }
      );
    }

    const startDate = data_inizio || `${anno}-01-01`;
    const endDate = data_fine || `${anno}-12-31`;

    // Aggrega dati da movimenti/registri/formulari
    const [movimentiRes, registriRes, formulariRes] = await Promise.all([
      supabase
        .from("rentri_movimenti")
        .select("id, quantita, codice_eer, data_operazione, sync_status")
        .eq("org_id", org_id)
        .gte("data_operazione", startDate)
        .lte("data_operazione", endDate)
        .eq("sync_status", "trasmesso"),
      
      supabase
        .from("rentri_registri")
        .select("id, tipo, stato")
        .eq("org_id", org_id)
        .eq("anno", parseInt(anno)),
      
      supabase
        .from("rentri_formulari")
        .select("id, stato, data_creazione")
        .eq("org_id", org_id)
        .gte("data_creazione", startDate)
        .lte("data_creazione", endDate)
    ]);

    const movimenti = movimentiRes.data || [];
    const registri = registriRes.data || [];
    const formulari = formulariRes.data || [];

    // Calcola totali
    const totaleQuantita = movimenti.reduce((sum, m) => sum + (Number.parseFloat(m.quantita) || 0), 0);

    // Raggruppa per codice EER
    const raggruppamentoEER: Record<string, { quantita: number; movimenti: number }> = {};
    movimenti.forEach(m => {
      const eer = m.codice_eer || 'N/A';
      if (!raggruppamentoEER[eer]) {
        raggruppamentoEER[eer] = { quantita: 0, movimenti: 0 };
      }
      raggruppamentoEER[eer].quantita += Number.parseFloat(m.quantita) || 0;
      raggruppamentoEER[eer].movimenti += 1;
    });

    // Crea dati MUD
    const datiMud = {
      raggruppamento_eer: raggruppamentoEER,
      movimenti_totali: movimenti.length,
      registri_totali: registri.length,
      formulari_totali: formulari.length,
      periodo: {
        inizio: startDate,
        fine: endDate
      }
    };

    // Crea record MUD
    const { data: mud, error: mudError } = await supabase
      .from("rentri_mud")
      .insert({
        org_id,
        anno: Number.parseInt(anno),
        stato: 'in_completamento',
        data_inizio: startDate,
        data_fine: endDate,
        dati_mud: datiMud,
        totale_movimenti: movimenti.length,
        totale_registri: registri.length,
        totale_formulari: formulari.length,
        totale_quantita: totaleQuantita
      })
      .select()
      .single();

    if (mudError) {
      console.error("[RENTRI-MUD] Errore creazione MUD:", mudError);
      return NextResponse.json(
        { error: "Errore creazione MUD", details: mudError.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mud,
        aggregazione: {
          movimenti: movimenti.length,
          registri: registri.length,
          formulari: formulari.length,
          totale_quantita: totaleQuantita,
          raggruppamento_eer: Object.keys(raggruppamentoEER).length
        }
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-MUD] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

