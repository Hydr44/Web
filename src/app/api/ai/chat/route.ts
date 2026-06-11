/**
 * Proxy AI Chat (text-only) — chiamate Claude server-side.
 *
 * Esiste già `/api/ai/scan` per chiamate vision (foto + prompt). Questa
 * route è il pendant text-only: niente immagini, solo system + prompt.
 * Usato da desktop (vfu-ai.js, aiDescriptions.js) per generare descrizioni
 * ricambi, classificazione CER, riconoscimento codici OEM.
 *
 * Migrazione 2026-06-11: OpenAI → Anthropic Claude. Niente API key sul
 * client (era esposta nel bundle Electron via VITE_OPENAI_API_KEY).
 *
 * Auth: Authorization: Bearer <supabase access_token>.
 * Body: {
 *   system: string,      // istruzioni di sistema
 *   prompt: string,      // user message
 *   model?: string,      // override modello (default Sonnet)
 *   max_tokens?: number, // default 2000
 *   temperature?: number,// default 0.3
 * }
 * Risposta: { text: string }  // contenuto testuale risposta Claude
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { checkRateLimit } from '@/lib/security';

export const runtime = 'nodejs';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_PROMPT_LEN = 60_000; // ~15k token, generoso
const MAX_OUTPUT_TOKENS = 4096;

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));

  // Auth: token sessione Supabase nel bearer.
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401, headers });
  }
  const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !userData?.user) {
    return NextResponse.json({ error: 'Sessione non valida' }, { status: 401, headers });
  }

  // Rate limit per utente: 60 chiamate / 10 min. Più generoso di /scan
  // perché qui non c'è costo immagini, ma comunque protetto da abuso.
  const rl = await checkRateLimit(`ai-chat:${userData.user.id}`, 60, 10 * 60 * 1000);
  if (!rl.allowed) {
    const min = Math.ceil((rl.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Troppe richieste AI. Riprova tra ${min} minut${min === 1 ? 'o' : 'i'}.` },
      { status: 429, headers },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Servizio AI non configurato sul server.' },
      { status: 500, headers },
    );
  }

  let body: {
    system?: string;
    prompt?: string;
    model?: string;
    max_tokens?: number;
    temperature?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400, headers });
  }

  const system = (body.system || '').trim();
  const prompt = (body.prompt || '').trim();
  if (!system || !prompt) {
    return NextResponse.json(
      { error: 'system e prompt obbligatori' },
      { status: 400, headers },
    );
  }
  if (prompt.length > MAX_PROMPT_LEN) {
    return NextResponse.json(
      { error: 'Prompt troppo lungo' },
      { status: 413, headers },
    );
  }

  const model = typeof body.model === 'string' && body.model.startsWith('claude-')
    ? body.model
    : DEFAULT_MODEL;
  const maxTokens = Math.min(
    Math.max(64, Number(body.max_tokens) || 2000),
    MAX_OUTPUT_TOKENS,
  );
  const temperature = (() => {
    const t = Number(body.temperature);
    return Number.isFinite(t) && t >= 0 && t <= 1 ? t : 0.3;
  })();

  try {
    const resp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      // NON propaghiamo i dettagli Anthropic al client (potrebbero contenere
      // info sulla nostra config). Loghiamo server-side per debug.
      console.error('[ai-chat] Anthropic error', resp.status, errText.slice(0, 500));
      return NextResponse.json(
        { error: 'Errore servizio AI. Riprova più tardi.' },
        { status: 502, headers },
      );
    }

    const data = await resp.json();
    // Anthropic ritorna content come array di blocchi {type, text}.
    // Concateniamo solo i blocchi text.
    const text = Array.isArray(data?.content)
      ? data.content
          .filter((b: { type?: string }) => b.type === 'text')
          .map((b: { text?: string }) => b.text || '')
          .join('\n')
          .trim()
      : '';
    if (!text) {
      return NextResponse.json(
        { error: 'Risposta AI vuota.' },
        { status: 502, headers },
      );
    }
    return NextResponse.json({ text }, { headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'errore sconosciuto';
    console.error('[ai-chat] exception', msg);
    return NextResponse.json(
      { error: 'Errore servizio AI. Riprova più tardi.' },
      { status: 502, headers },
    );
  }
}
