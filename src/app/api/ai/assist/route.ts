import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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

    const systemPrompt = [
      "Sei un assistente integrato in RescueManager, un gestionale per demolitori e rifiuti.",
      "Rispondi SEMPRE in italiano, con tono chiaro e pratico.",
      "Devi aiutare l'utente a usare l'app passo per passo, come un collega esperto.",
      "Non inventare funzioni che non esistono nell'app; se non sei sicuro, spiega cosa può fare in generale.",
      contextParts.length ? `Contesto: ${contextParts.join(" | ")}` : "",
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



