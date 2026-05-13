/**
 * GET /api/quotes/:uuid/pdf
 * Serve il PDF preventivo tramite il nostro dominio (no Supabase URL pubblico).
 *
 * Sicurezza:
 *  - Usa public_uuid del quote (non l'ID interno) → indovinabilità ~0 (UUID v4)
 *  - Streamma dal bucket Supabase Storage (signed URL temporaneo lato server)
 *  - Track view incrementa contatore quote_viewed
 *
 * URL pulito: https://rescuemanager.eu/api/quotes/<uuid>/pdf
 *           o https://rescuemanager.eu/quotes/<uuid>/pdf (vedi rewrite next.config)
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(_request: Request, { params }: { params: { uuid: string } }) {
  try {
    // 1. Trova quote
    const { data: quote, error } = await supabaseAdmin
      .from('lead_quotes')
      .select('id, quote_number, pdf_url, lead_id, viewed_count')
      .eq('public_uuid', params.uuid)
      .maybeSingle();

    if (error || !quote) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
    }

    // 2. Estrai path da Supabase storage URL
    // URL pattern: .../storage/v1/object/public/documents/quotes/<id>/<file>.pdf
    let storagePath: string | null = null;
    if (quote.pdf_url) {
      const m = quote.pdf_url.match(/\/documents\/(.+\.pdf)$/);
      if (m) storagePath = m[1];
    }

    // Fallback: prova path canonico
    if (!storagePath) {
      storagePath = `quotes/${quote.id}/${quote.quote_number}.pdf`;
    }

    // 3. Download dal bucket privato
    const { data: file, error: dlError } = await supabaseAdmin.storage
      .from('documents')
      .download(storagePath);

    if (dlError || !file) {
      console.error('[pdf-proxy] download failed:', dlError?.message);
      return NextResponse.json({ error: 'PDF non disponibile' }, { status: 404 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // 4. Track view (incrementa contatore — silent, non blocca)
    try {
      await supabaseAdmin
        .from('lead_quotes')
        .update({ viewed_count: (quote.viewed_count || 0) + 1, last_viewed_at: new Date().toISOString() })
        .eq('id', quote.id);
    } catch { /* ignore */ }

    // 5. Return PDF inline (apre nel browser)
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Preventivo_${quote.quote_number}.pdf"`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e: any) {
    console.error('[pdf-proxy] error:', e);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
