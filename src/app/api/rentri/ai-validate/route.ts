/**
 * API Route: Validazione IA Pre-Invio RENTRI
 * POST /api/rentri/ai-validate
 * Valida movimenti, formulari e registri con IA prima dell'invio a RENTRI
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleCors, corsHeaders } from "@/lib/cors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

/**
 * POST /api/rentri/ai-validate
 * Valida un'entità (movimento, formulario, registro) con IA
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY non configurata" },
        { status: 500, headers }
      );
    }

    const body = await request.json();
    const { tipo_entita, entita_id, org_id, dati_entita } = body;

    if (!tipo_entita || !entita_id || !org_id || !dati_entita) {
      return NextResponse.json(
        { error: "tipo_entita, entita_id, org_id e dati_entita richiesti" },
        { status: 400, headers }
      );
    }

    if (!['movimento', 'formulario', 'registro'].includes(tipo_entita)) {
      return NextResponse.json(
        { error: "tipo_entita deve essere: movimento, formulario o registro" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Costruisci prompt per l'IA basato sul tipo di entità
    const prompt = buildValidationPrompt(tipo_entita, dati_entita);

    // Chiama OpenAI per validazione
    const aiResponse = await callOpenAI(prompt, tipo_entita);

    // Analizza risposta IA e costruisci alert
    const alert_ia = parseAIResponse(aiResponse, tipo_entita);

    // Determina stato validazione
    const stato_validazione = determineValidationStatus(alert_ia);

    // Salva validazione nel DB
    const { data: validation, error: validationError } = await supabase
      .from("rentri_ai_validations")
      .upsert({
        org_id,
        tipo_entita,
        entita_id,
        stato_validazione,
        alert_ia,
        prompt_inviato: prompt,
        risposta_ia: aiResponse,
        analisi_ia: JSON.parse(aiResponse || '{}'),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tipo_entita,entita_id'
      })
      .select()
      .single();

    if (validationError) {
      console.error("[RENTRI-AI-VALIDATE] Errore salvataggio validazione:", validationError);
      return NextResponse.json(
        { error: "Errore salvataggio validazione", details: validationError.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        validation: {
          stato: stato_validazione,
          alert: alert_ia,
          validation_id: validation.id
        }
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("[RENTRI-AI-VALIDATE] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * Costruisci prompt per validazione IA
 */
function buildValidationPrompt(tipo_entita: string, dati_entita: any): string {
  const basePrompt = `Analizza questi dati RENTRI e segnala incongruenze, errori sospetti o dati mancanti.
Rispondi SOLO con un JSON valido nel formato:
{
  "alert": [
    {
      "tipo": "error|warning|info",
      "campo": "nome_campo",
      "messaggio": "Descrizione problema",
      "severita": 1-10,
      "suggerimento": "Come correggere (opzionale)"
    }
  ],
  "riepilogo": "Riepilogo validazione",
  "ok": true/false
}`;

  if (tipo_entita === 'movimento') {
    return `${basePrompt}

DATI MOVIMENTO DA VALIDARE:
${JSON.stringify(dati_entita, null, 2)}

CONTROLLA:
- Codice EER valido e coerente con descrizione
- Quantità ragionevole (non zero, non negativa, non eccessiva)
- Unità di misura coerente (kg per rifiuti solidi, litri per liquidi)
- Causale operazione coerente con tipo operazione (carico/scarico)
- Data operazione coerente e non futura
- Provenienza corretta (U=utente, S=smaltitore)
- Caratteristiche pericolo presenti se rifiuto pericoloso (codice EER che inizia con asterisco)
- FIR riferimento presente se causale trasporto
- Coerenza tra quantità e codice EER (es: veicoli fuori uso tipicamente > 1000 kg)
- Annotazioni non troppo lunghe (max 500 caratteri)
`;
  }

  if (tipo_entita === 'formulario') {
    return `${basePrompt}

DATI FORMULARIO FIR DA VALIDARE:
${JSON.stringify(dati_entita, null, 2)}

CONTROLLA:
- Codici EER validi e coerenti
- Quantità ragionevoli per ogni codice EER
- Date trasporto coerenti (data_fine >= data_inizio)
- Codici fiscali validi (16 caratteri per PF, 11 per PA)
- Dati produttore/destinatario/trasportatore completi
- Autorizzazione destinatario presente se richiesta
- Albo trasportatore presente se richiesto
- Coerenza tra quantità e tipo rifiuto
`;
  }

  if (tipo_entita === 'registro') {
    return `${basePrompt}

DATI REGISTRO DA VALIDARE:
${JSON.stringify(dati_entita, null, 2)}

CONTROLLA:
- Anno valido (non futuro)
- Tipo registro coerente
- Unità locale presente se richiesta
- Autorizzazione presente e valida
- Numero registro univoco se presente
`;
  }

  return basePrompt;
}

/**
 * Chiama OpenAI API
 */
async function callOpenAI(prompt: string, tipo_entita: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sei un esperto di RENTRI (Registro Elettronico Nazionale Tracciabilità Rifiuti). 
Analizza i dati e segnala SOLO problemi reali e significativi. 
Rispondi SEMPRE con JSON valido, senza markdown o testo aggiuntivo.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[RENTRI-AI-VALIDATE] OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Estrai JSON dalla risposta (rimuovi markdown se presente)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : content;
}

/**
 * Analizza risposta IA e costruisci array alert
 */
function parseAIResponse(aiResponse: string, tipo_entita: string): any[] {
  try {
    const parsed = JSON.parse(aiResponse);
    return parsed.alert || [];
  } catch (e) {
    console.error('[RENTRI-AI-VALIDATE] Errore parsing risposta IA:', e);
    return [{
      tipo: 'warning',
      campo: 'sistema',
      messaggio: 'Errore analisi IA, verificare manualmente',
      severita: 5
    }];
  }
}

/**
 * Determina stato validazione basato su alert
 */
function determineValidationStatus(alert_ia: any[]): string {
  if (alert_ia.length === 0) {
    return 'ok';
  }

  const hasError = alert_ia.some(a => a.tipo === 'error');
  if (hasError) {
    return 'error';
  }

  const hasWarning = alert_ia.some(a => a.tipo === 'warning');
  if (hasWarning) {
    return 'warning';
  }

  return 'ok';
}

