/**
 * API Route: Validazione IA Pre-Invio SDI
 * POST /api/sdi/ai-validate
 * Valida fatture con IA prima dell'invio a SDI
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
 * POST /api/sdi/ai-validate
 * Valida una fattura con IA prima dell'invio a SDI
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
    const { invoice_id, org_id, invoice_data } = body;

    if (!invoice_id || !org_id || !invoice_data) {
      return NextResponse.json(
        { error: "invoice_id, org_id e invoice_data richiesti" },
        { status: 400, headers }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Costruisci prompt per l'IA
    const prompt = buildValidationPrompt(invoice_data);

    // Chiama OpenAI per validazione
    const aiResponse = await callOpenAI(prompt);

    // Analizza risposta IA e costruisci alert
    const alert_ia = parseAIResponse(aiResponse);

    // Determina stato validazione
    const stato_validazione = determineValidationStatus(alert_ia);

    // Salva validazione nel DB
    const { data: validation, error: validationError } = await supabase
      .from("sdi_ai_validations")
      .upsert({
        org_id,
        invoice_id,
        stato_validazione,
        alert_ia,
        prompt_inviato: prompt,
        risposta_ia: aiResponse,
        analisi_ia: JSON.parse(aiResponse || '{}'),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'invoice_id'
      })
      .select()
      .single();

    if (validationError) {
      console.error("[SDI-AI-VALIDATE] Errore salvataggio validazione:", validationError);
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
    console.error("[SDI-AI-VALIDATE] Errore:", error);
    return NextResponse.json(
      { error: "Errore interno", details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * Costruisci prompt per validazione IA fattura SDI
 */
function buildValidationPrompt(invoice_data: any): string {
  return `Analizza questi dati di fattura elettronica SDI e segnala incongruenze, errori sospetti o dati mancanti.
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
}

DATI FATTURA DA VALIDARE:
${JSON.stringify(invoice_data, null, 2)}

CONTROLLA:

1. CODICE FISCALE / PARTITA IVA:
   - CF deve essere 16 caratteri alfanumerici con checksum valido
   - P.IVA deve essere 11 cifre con checksum Luhn valido
   - Se presente nome/cognome/data nascita, verifica coerenza con CF
   - CF deve corrispondere a: cognome (3 lettere) + nome (3 lettere) + data (YYMMDD) + comune (4 caratteri) + checksum
   - Sesso deve essere coerente con CF (giorno +40 per femmine)
   - Città e provincia devono corrispondere al codice comune nel CF

2. PARTITA IVA:
   - Deve essere valida (11 cifre, checksum Luhn)
   - Se presente denominazione, deve essere coerente con P.IVA
   - Sede legale deve essere coerente con P.IVA

3. CODICE DESTINATARIO:
   - Per FPR12 (privati): deve essere 6 caratteri alfanumerici
   - Per FPA12 (PA): deve essere 7 caratteri alfanumerici
   - Codice destinatario deve essere valido e attivo
   - Se PA, verificare coerenza con anagrafica IPA

4. DATI ANAGRAFICI:
   - Nome e cognome devono essere coerenti con CF
   - Data di nascita deve essere coerente con CF (YYMMDD)
   - Sesso deve essere coerente con CF
   - Città e provincia devono corrispondere al codice comune nel CF
   - Se presente CAP, deve essere coerente con città/provincia

5. DATI FATTURA:
   - Data fattura non deve essere futura
   - Numero fattura deve essere univoco
   - Importi devono essere coerenti (imponibile + IVA = totale)
   - Aliquota IVA deve essere valida (0, 4, 5, 10, 22, etc.)
   - Natura IVA deve essere presente se aliquota = 0
   - Descrizione servizi/beni non deve essere troppo generica

6. INDIRIZZI:
   - Indirizzo completo (via, civico, CAP, città, provincia)
   - CAP deve essere coerente con città/provincia
   - Provincia deve essere codice di 2 lettere valido

7. COERENZA GENERALE:
   - Dati cliente completi e coerenti
   - Dati azienda (cedente) completi e coerenti
   - Tutti i campi obbligatori presenti
   - Formati corretti (date, numeri, codici)

Segnala SOLO problemi reali e significativi.`;
}

/**
 * Chiama OpenAI API
 */
async function callOpenAI(prompt: string): Promise<string> {
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
          content: `Sei un esperto di fatturazione elettronica SDI (Sistema di Interscambio).
Analizza i dati e segnala SOLO problemi reali e significativi che potrebbero causare rifiuto da SDI.
Rispondi SEMPRE con JSON valido, senza markdown o testo aggiuntivo.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[SDI-AI-VALIDATE] OpenAI API error:', error);
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
function parseAIResponse(aiResponse: string): any[] {
  try {
    const parsed = JSON.parse(aiResponse);
    return parsed.alert || [];
  } catch (e) {
    console.error('[SDI-AI-VALIDATE] Errore parsing risposta IA:', e);
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
