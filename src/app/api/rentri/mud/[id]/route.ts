/**
 * API Route: Gestione MUD singolo
 * GET /api/rentri/mud/[id] - Dettaglio MUD
 * PUT /api/rentri/mud/[id] - Aggiorna MUD
 * DELETE /api/rentri/mud/[id] - Elimina MUD
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
 * GET /api/rentri/mud/[id]
 * Dettaglio MUD
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { id: mudId } = params;
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get('org_id');

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id richiesto" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: mud, error } = await supabase
      .from("rentri_mud")
      .select("*")
      .eq("id", mudId)
      .eq("org_id", org_id)
      .single();

    if (error || !mud) {
      return NextResponse.json(
        { error: "MUD non trovato" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mud
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
 * PUT /api/rentri/mud/[id]
 * Aggiorna MUD
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { id: mudId } = params;
    const body = await request.json();
    const { org_id, stato, note } = body;

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id richiesto" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: any = {};
    if (stato) updateData.stato = stato;
    if (note !== undefined) updateData.note = note;

    const { data: mud, error } = await supabase
      .from("rentri_mud")
      .update(updateData)
      .eq("id", mudId)
      .eq("org_id", org_id)
      .select()
      .single();

    if (error) {
      console.error("[RENTRI-MUD] Errore aggiornamento:", error);
      return NextResponse.json(
        { error: "Errore aggiornamento MUD", details: error.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mud
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
 * POST /api/rentri/mud/[id]?action=generate-xml|generate-pdf
 * Genera XML o PDF per il MUD
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { id: mudId } = params;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (!action || (action !== 'generate-xml' && action !== 'generate-pdf')) {
      return NextResponse.json(
        { error: "action richiesto (generate-xml o generate-pdf)" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Recupera MUD
    const { data: mud, error: mudError } = await supabase
      .from("rentri_mud")
      .select("*")
      .eq("id", mudId)
      .single();

    if (mudError || !mud) {
      return NextResponse.json(
        { error: "MUD non trovato" },
        { status: 404, headers }
      );
    }

    if (action === 'generate-xml') {
      // Genera XML
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MUD xmlns="http://www.rentri.gov.it/mud">
  <Dichiarazione>
    <Anno>${mud.anno}</Anno>
    <Periodo>
      <DataInizio>${mud.data_inizio}</DataInizio>
      <DataFine>${mud.data_fine}</DataFine>
    </Periodo>
    <Totali>
      <Movimenti>${mud.totale_movimenti || 0}</Movimenti>
      <Registri>${mud.totale_registri || 0}</Registri>
      <Formulari>${mud.totale_formulari || 0}</Formulari>
      <QuantitaTotale unita="kg">${mud.totale_quantita || 0}</QuantitaTotale>
    </Totali>
    ${mud.dati_mud?.raggruppamento_eer ? Object.entries(mud.dati_mud.raggruppamento_eer).map(([eer, dati]: [string, any]) => `
    <Raggruppamento>
      <CodiceEER>${eer}</CodiceEER>
      <Quantita unita="kg">${dati.quantita || 0}</Quantita>
      <Movimenti>${dati.movimenti || 0}</Movimenti>
    </Raggruppamento>`).join('') : ''}
  </Dichiarazione>
</MUD>`;

      const xmlBase64 = Buffer.from(xml, 'utf-8').toString('base64');

      return NextResponse.json(
        {
          success: true,
          xml: xmlBase64,
          filename: `MUD_${mud.anno}_${mudId.substring(0, 8)}.xml`
        },
        { status: 200, headers }
      );
    } else if (action === 'generate-pdf') {
      // Genera HTML/PDF
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MUD ${mud.anno}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .totali { background-color: #f9f9f9; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Modello Unico Dichiarazione Rifiuti (MUD) - Anno ${mud.anno}</h1>
  
  <div>
    <p><strong>Periodo:</strong> ${new Date(mud.data_inizio).toLocaleDateString('it-IT')} - ${new Date(mud.data_fine).toLocaleDateString('it-IT')}</p>
    <p><strong>Stato:</strong> ${mud.stato}</p>
    ${mud.numero_protocollo ? `<p><strong>Protocollo:</strong> ${mud.numero_protocollo}</p>` : ''}
  </div>

  <h2>Totali</h2>
  <table>
    <tr>
      <th>Movimenti</th>
      <th>Registri</th>
      <th>Formulari</th>
      <th>Quantità Totale (kg)</th>
    </tr>
    <tr class="totali">
      <td>${mud.totale_movimenti || 0}</td>
      <td>${mud.totale_registri || 0}</td>
      <td>${mud.totale_formulari || 0}</td>
      <td>${(mud.totale_quantita || 0).toFixed(2)}</td>
    </tr>
  </table>

  ${mud.dati_mud?.raggruppamento_eer ? `
  <h2>Raggruppamento per Codice EER</h2>
  <table>
    <tr>
      <th>Codice EER</th>
      <th>Quantità (kg)</th>
      <th>Numero Movimenti</th>
    </tr>
    ${Object.entries(mud.dati_mud.raggruppamento_eer).map(([eer, dati]: [string, any]) => `
    <tr>
      <td>${eer}</td>
      <td>${(dati.quantita || 0).toFixed(2)}</td>
      <td>${dati.movimenti || 0}</td>
    </tr>`).join('')}
  </table>
  ` : ''}

  <div style="margin-top: 40px; font-size: 12px; color: #666;">
    <p>Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
    <p>Ambiente: ${process.env.NEXT_PUBLIC_RENTRI_ENV || 'DEMO'}</p>
  </div>
</body>
</html>`;

      const htmlBase64 = Buffer.from(htmlContent, 'utf-8').toString('base64');

      return NextResponse.json(
        {
          success: true,
          html: htmlBase64,
          filename: `MUD_${mud.anno}_${mudId.substring(0, 8)}.html`
        },
        { status: 200, headers }
      );
    }

    return NextResponse.json(
      { error: "Azione non valida" },
      { status: 400, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-MUD-GENERATE] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

