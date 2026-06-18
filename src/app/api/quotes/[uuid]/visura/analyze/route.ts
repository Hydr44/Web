// Analisi visura camerale (F5). PUBLIC, validata sul public_uuid del preventivo
// (modello A: il cliente ha il link, non un account). Claude legge il PDF e
// estrae i dati aziendali con confidenza per-campo; confronta la P.IVA estratta
// con quella del preventivo (anti-frode / documento sbagliato).
//
//   POST /api/quotes/[uuid]/visura/analyze   body: { pdf_base64 }
//   → { ok, fields:{...con confidence}, piva_mismatch, raw }
//
// Il salvataggio su R2/lead_documents è separato (presign/finalize, lato wizard).
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { checkRateLimit } from '@/lib/security';
import { hasVerifiedOtp } from '@/lib/otp-guard';

export const runtime = 'nodejs';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MAX_PDF_B64 = 14 * 1024 * 1024; // ~10MB file in base64

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

function normPiva(s: string | null | undefined): string {
  return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/^it/, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } },
) {
  const headers = corsHeaders(request.headers.get('origin'));
  const uuid = params.uuid;

  // 1) Valida il token = preventivo esistente + pagato/in verifica.
  const { data: quote } = await supabaseAdmin
    .from('lead_quotes')
    .select('id, status, lead_id, leads!lead_quotes_lead_id_fkey(status, vat_number, company)')
    .eq('public_uuid', uuid)
    .maybeSingle();
  if (!quote) {
    return NextResponse.json({ ok: false, error: 'Preventivo non trovato.' }, { status: 404, headers });
  }
  const lead = (quote as Record<string, any>).leads || {};
  const paid = ['paid', 'pending_activation', 'activated'].includes(quote.status as string);
  const inVerifica = lead.status === 'in_verifica';
  if (!paid && !inVerifica) {
    return NextResponse.json({ ok: false, error: 'La verifica è disponibile dopo il pagamento.' }, { status: 403, headers });
  }

  // 1b) OTP email obbligatorio lato server (il gate del wizard non basta: chi ha
  //     il link potrebbe chiamare direttamente saltando la verifica email).
  if (!(await hasVerifiedOtp(request, uuid))) {
    return NextResponse.json({ ok: false, error: 'Verifica email richiesta.', otp_required: true }, { status: 401, headers });
  }

  // 2) Rate limit per preventivo (max 5 analisi / 24h).
  const rl = await checkRateLimit(`visura-analyze:${uuid}`, 5, 24 * 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Troppe analisi. Riprova più tardi.' }, { status: 429, headers });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Analisi non disponibile (AI non configurata).', configured: false }, { status: 503, headers });
  }

  let body: { pdf_base64?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Body non valido' }, { status: 400, headers }); }
  const pdf = (body.pdf_base64 || '').replace(/^data:application\/pdf;base64,/, '');
  if (!pdf) return NextResponse.json({ ok: false, error: 'PDF mancante.' }, { status: 400, headers });
  if (pdf.length > MAX_PDF_B64) return NextResponse.json({ ok: false, error: 'PDF troppo grande (max ~10MB).' }, { status: 413, headers });

  const system =
    'Sei un estrattore di dati da visure camerali italiane (Registro Imprese). ' +
    'Leggi il PDF ed estrai SOLO i dati presenti. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, ' +
    'senza testo prima/dopo, senza markdown. Per ogni campo includi un valore (stringa, "" se assente) ' +
    'e una confidenza 0-1. Schema: ' +
    '{"ragione_sociale":{"v":"","c":0},"partita_iva":{"v":"","c":0},"codice_fiscale":{"v":"","c":0},' +
    '"pec":{"v":"","c":0},"codice_ateco":{"v":"","c":0},"forma_giuridica":{"v":"","c":0},' +
    '"indirizzo":{"v":"","c":0},"citta":{"v":"","c":0},"provincia":{"v":"","c":0},"cap":{"v":"","c":0},' +
    '"codice_sdi":{"v":"","c":0},"stato_attivita":{"v":"","c":0},"overall_confidence":0,"is_visura":true}. ' +
    'Se il documento NON è una visura camerale, metti is_visura=false e overall_confidence basso.';

  let aiJson: Record<string, any> | null = null;
  let rawText = '';
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1500,
        system: [{ type: 'text', text: system }],
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf } },
            { type: 'text', text: 'Estrai i dati di questa visura nel JSON richiesto.' },
          ],
        }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('[visura/analyze] Claude KO:', res.status, t.slice(0, 300));
      return NextResponse.json({ ok: false, error: `Errore analisi (${res.status})` }, { status: 502, headers });
    }
    const data = await res.json();
    const tb = Array.isArray(data.content) ? data.content.find((b: { type?: string }) => b.type === 'text') : null;
    rawText = (tb?.text || '').trim();
    const m = rawText.match(/\{[\s\S]*\}/);
    if (m) aiJson = JSON.parse(m[0]);
  } catch (err) {
    console.error('[visura/analyze] errore:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: 'Errore interno analisi.' }, { status: 500, headers });
  }

  if (!aiJson) {
    // Fallback: l'AI non ha prodotto JSON leggibile → il wizard mostrerà il form manuale.
    return NextResponse.json({ ok: true, fields: null, low_confidence: true, piva_mismatch: false, message: 'Non siamo riusciti a leggere la visura automaticamente. Inserisci i dati a mano.' }, { headers });
  }

  // Check P.IVA: estratta vs quella dichiarata sul lead/preventivo.
  const extractedPiva = normPiva(aiJson.partita_iva?.v);
  const declaredPiva = normPiva(lead.vat_number);
  const pivaMismatch = !!extractedPiva && !!declaredPiva && extractedPiva !== declaredPiva;
  const lowConfidence = (Number(aiJson.overall_confidence) || 0) < 0.5 || aiJson.is_visura === false;

  return NextResponse.json({
    ok: true,
    fields: aiJson,
    low_confidence: lowConfidence,
    piva_mismatch: pivaMismatch,
    declared_piva: lead.vat_number || null,
    not_a_visura: aiJson.is_visura === false,
  }, { headers });
}
