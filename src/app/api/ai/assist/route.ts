import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function getTransportsHelp() {
  return [
    "Sei nella sezione **Trasporti** di RescueManager.",
    "",
    "- Qui gestisci tutti i viaggi dei mezzi: ritiri, consegne, demolizioni collegate, rifiuti, ecc.",
    "- La tabella mostra i trasporti con cliente, mezzo, autista, indirizzi di ritiro/consegna, stato e date.",
    "",
    "Flusso tipico per creare un nuovo trasporto:",
    "1. Clicca su **\"Nuovo Trasporto\"** (puoi usare anche il pulsante rapido nella sidebar).",
    "2. Seleziona o crea il **cliente** che richiede il servizio.",
    "3. Scegli il **mezzo** (camion) e l'**autista** assegnato.",
    "4. Compila **indirizzo di ritiro** e **indirizzo di consegna** (piazzale, impianto, demolizione, ecc.).",
    "5. Imposta **data e ora** del ritiro (e se serve della consegna).",
    "6. Aggiungi eventuali **note operative** (es. orari del cliente, accesso difficile, documenti da portare).",
    "7. Salva il trasporto: comparirà nella lista e potrai aggiornarne lo stato man mano che viene eseguito.",
    "",
    "Cosa puoi fare dalla lista trasporti:",
    "- Cercare e filtrare per cliente, data, stato o testo libero.",
    "- Aprire il dettaglio di un trasporto per modificarlo o vedere tutte le informazioni.",
    "- Collegare il trasporto ad altre sezioni (es. demolizioni, rifiuti) se la tua configurazione lo prevede.",
    "",
    "Quando spieghi a un operaio:",
    "- Concentrati su: **chi** (cliente, autista), **cosa** (tipo di servizio), **dove** (indirizzi) e **quando** (date/ore).",
    "- Fagli vedere che ogni riga della tabella è un viaggio completo: dall'ordine fino alla chiusura del servizio.",
  ].join("\n");
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: "OPENAI_API_KEY non configurata sul server" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { org_id, route, question } = body || {};

    if (!question || typeof question !== "string") {
      return new NextResponse(
        JSON.stringify({ error: "Parametro 'question' mancante" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const contextParts: string[] = [];
    if (org_id) contextParts.push(`Org ID: ${org_id}`);
    if (route) contextParts.push(`Pagina corrente: ${route}`);

    const extraContext: string[] = [];
    if (route && route.startsWith("/trasporti")) {
      extraContext.push(getTransportsHelp());
    }

    const systemPrompt = [
      "Sei un assistente integrato in RescueManager, un gestionale per demolitori e rifiuti.",
      "Rispondi SEMPRE in italiano, con tono chiaro e pratico.",
      "Devi aiutare l'utente a usare l'app passo per passo, come un collega esperto.",
      "Non inventare funzioni che non esistono nell'app; se non sei sicuro, spiega cosa può fare in generale.",
      contextParts.length ? `Contesto: ${contextParts.join(" | ")}` : "",
      extraContext.length ? `Dettagli schermata:\n${extraContext.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.4,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text().catch(() => "");
      console.error("[AI-ASSIST] OpenAI API error:", openaiResponse.status, errorText);

      return new NextResponse(
        JSON.stringify({
          error: "Errore chiamata OpenAI",
          status: openaiResponse.status,
        }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const data = await openaiResponse.json();
    const answer =
      data?.choices?.[0]?.message?.content ||
      "Non sono riuscito a generare una risposta al momento.";

    return new NextResponse(
      JSON.stringify({ answer }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[AI-ASSIST] Errore interno:", error);
    return new NextResponse(
      JSON.stringify({ error: "Errore interno assistente AI" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
}



