/**
 * Proxy ScanAI — l'app mobile invia immagine + prompt, il server chiama
 * Claude con la chiave server-side. Nessuna chiave API sul device.
 *
 * Auth: Authorization: Bearer <supabase access_token> (sessione utente mobile).
 * Body: { system: string, prompt: string, image_base64: string }
 * Risposta: { text: string }  (blocco testo della risposta Claude)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { checkRateLimit } from '@/lib/security';

export const runtime = 'nodejs';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MAX_IMAGE_B64 = 8 * 1024 * 1024; // ~8MB base64

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));

  // Auth: token sessione Supabase nel bearer
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401, headers });
  }
  const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !userData?.user) {
    return NextResponse.json({ error: 'Sessione non valida' }, { status: 401, headers });
  }

  // Rate limit per utente: max 20 scansioni / 10 min
  const rl = await checkRateLimit(`ai-scan:${userData.user.id}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    const min = Math.ceil((rl.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Troppe scansioni. Riprova tra ${min} minut${min === 1 ? 'o' : 'i'}.` },
      { status: 429, headers });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non configurata sul server' }, { status: 500, headers });
  }

  let body: { system?: string; prompt?: string; image_base64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400, headers });
  }
  const system = (body.system || '').trim();
  const prompt = (body.prompt || '').trim();
  const imageB64 = body.image_base64 || '';
  if (!system || !prompt || !imageB64) {
    return NextResponse.json({ error: 'system, prompt e image_base64 obbligatori' }, { status: 400, headers });
  }
  if (imageB64.length > MAX_IMAGE_B64) {
    return NextResponse.json({ error: 'Immagine troppo grande' }, { status: 413, headers });
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        system: [
          { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
        ],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageB64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[ai/scan] Claude KO:', res.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: `Errore Claude ${res.status}` }, { status: 502, headers });
    }

    const data = await res.json();
    const textBlock = Array.isArray(data.content)
      ? data.content.find((b: { type?: string }) => b.type === 'text')
      : null;
    const text = (textBlock?.text || '').trim();
    if (!text) {
      return NextResponse.json({ error: 'Risposta Claude vuota' }, { status: 502, headers });
    }
    return NextResponse.json({ text }, { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai/scan] errore:', msg);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500, headers });
  }
}
