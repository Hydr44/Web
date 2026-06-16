// Assistente in-app (banner help "RescueAI"). Migrato 2026-06-11 da OpenAI
// a Anthropic Claude. La chiave resta server-side (env ANTHROPIC_API_KEY);
// il client non ha mai visto la key.
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

function getTransportsHelp() {
  return [
    "Sei nella sezione Trasporti di RescueManager.",
    "",
    "Qui gestisci tutti i viaggi dei mezzi: ritiri, consegne, demolizioni collegate, rifiuti, ecc.",
    "La tabella mostra i trasporti con cliente, mezzo, autista, indirizzi di ritiro/consegna, stato e date.",
    "",
    "Flusso tipico per creare un nuovo trasporto:",
    "1) Clicca sul pulsante Nuovo Trasporto (puoi usare anche il pulsante rapido nella sidebar).",
    "2) Seleziona o crea il cliente che richiede il servizio.",
    "3) Scegli il mezzo (camion) e l'autista assegnato.",
    "4) Compila indirizzo di ritiro e indirizzo di consegna (piazzale, impianto, demolizione, ecc.).",
    "5) Imposta data e ora del ritiro (e, se serve, della consegna).",
    "6) Aggiungi eventuali note operative (ad esempio orari del cliente, accesso difficile, documenti da portare).",
    "7) Salva il trasporto: comparirà nella lista e potrai aggiornarne lo stato man mano che viene eseguito.",
    "",
    "Cosa puoi fare dalla lista trasporti:",
    "- Cercare e filtrare per cliente, data, stato o testo libero.",
    "- Aprire il dettaglio di un trasporto per modificarlo o vedere tutte le informazioni.",
    "- Collegare il trasporto ad altre sezioni (ad esempio demolizioni o rifiuti) se la tua configurazione lo prevede.",
    "",
    "Quando spieghi a un operaio:",
    "- Concentrati su: chi (cliente, autista), cosa (tipo di servizio), dove (indirizzi) e quando (date e orari).",
    "- Fagli vedere che ogni riga della tabella è un viaggio completo, dall'ordine fino alla chiusura del servizio.",
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: "Servizio AI non configurato sul server" }),
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
      "Rispondi SEMPRE a passi numerati o a punti, una azione per riga, invece di un unico blocco di testo.",
      "Non usare asterischi, markdown o virgolette inutili: rispondi in testo semplice, con frasi brevi e linee separate.",
      "Non inventare funzioni che non esistono nell'app; se non sei sicuro, spiega cosa può fare in generale.",
      contextParts.length ? `Contesto: ${contextParts.join(" | ")}` : "",
      extraContext.length ? `Dettagli schermata:\n${extraContext.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text().catch(() => "");
      console.error("[AI-ASSIST] Claude API error:", claudeResponse.status, errorText.slice(0, 500));

      return new NextResponse(
        JSON.stringify({
          error: "Errore servizio AI",
          status: claudeResponse.status,
        }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const data = await claudeResponse.json();
    // Anthropic ritorna content come array di blocchi {type, text}.
    const answer = Array.isArray(data?.content)
      ? data.content
          .filter((b: { type?: string }) => b.type === "text")
          .map((b: { text?: string }) => b.text || "")
          .join("\n")
          .trim() || "Non sono riuscito a generare una risposta al momento."
      : "Non sono riuscito a generare una risposta al momento.";

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



