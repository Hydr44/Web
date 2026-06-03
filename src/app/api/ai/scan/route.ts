/**
 * Proxy ScanAI — l'app mobile invia immagine/i + prompt, il server chiama
 * Claude con la chiave server-side. Nessuna chiave API sul device.
 *
 * Auth: Authorization: Bearer <supabase access_token> (sessione utente mobile).
 * Body: {
 *   system: string,
 *   prompt: string,
 *   image_base64?: string,           // legacy singola foto
 *   image_base64s?: string[],        // nuovo: array multi-foto (max 4)
 * }
 * Almeno UNO tra image_base64 / image_base64s deve essere presente.
 * Risposta: { text: string }  (blocco testo della risposta Claude)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { checkRateLimit } from '@/lib/security';

export const runtime = 'nodejs';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MAX_IMAGE_B64 = 8 * 1024 * 1024; // ~8MB base64 per singola foto
const MAX_IMAGES = 4;                  // limite Claude vision multi-image

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

  let body: { system?: string; prompt?: string; image_base64?: string; image_base64s?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400, headers });
  }
  const system = (body.system || '').trim();
  const prompt = (body.prompt || '').trim();

  // Accetta sia il campo legacy `image_base64` (singolare) sia il nuovo
  // `image_base64s` (array multi-foto). Almeno uno dei due è obbligatorio.
  // Stringhe vuote vengono filtrate via.
  const arr = Array.isArray(body.image_base64s)
    ? body.image_base64s.filter((s) => typeof s === 'string' && s.length > 0)
    : [];
  if (body.image_base64 && typeof body.image_base64 === 'string') {
    arr.unshift(body.image_base64);
  }
  const images = arr.slice(0, MAX_IMAGES);

  if (!system || !prompt || images.length === 0) {
    return NextResponse.json(
      { error: 'system, prompt e image_base64 / image_base64s obbligatori' },
      { status: 400, headers },
    );
  }
  for (const img of images) {
    if (img.length > MAX_IMAGE_B64) {
      return NextResponse.json({ error: 'Una delle immagini è troppo grande (>8MB base64)' }, { status: 413, headers });
    }
  }

  // Costruisce il content multi-modale per Claude: tutte le immagini prima,
  // poi il prompt testo. Claude vision accetta più image blocks in un solo
  // turn (multi-image analysis nativa).
  const content: Array<
    | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
    | { type: 'text'; text: string }
  > = images.map((data) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
  }));
  content.push({ type: 'text', text: prompt });

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
          { role: 'user', content },
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
