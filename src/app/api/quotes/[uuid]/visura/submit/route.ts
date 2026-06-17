// Invia in verifica (F5). PUBLIC, validata sul public_uuid. Il cliente conferma i
// dati (estratti dall'AI o corretti a mano) e carica la visura:
//   - salva il PDF su R2 + riga in lead_documents (per la Revisione admin)
//   - aggiorna i campi azienda sul lead con i valori CONFERMATI dal cliente
//   - assicura leads.status='in_verifica' (anche dopo una "richiedi correzione")
//
//   POST /api/quotes/[uuid]/visura/submit   body: { pdf_base64, fields:{ragione_sociale,partita_iva,...} }
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { uploadToR2 } from '@/lib/r2-storage';

export const runtime = 'nodejs';

const MAX_PDF_B64 = 14 * 1024 * 1024;

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

function s(v: unknown): string { return typeof v === 'string' ? v.trim() : ''; }

export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } },
) {
  const headers = corsHeaders(request.headers.get('origin'));
  const uuid = params.uuid;

  const { data: quote } = await supabaseAdmin
    .from('lead_quotes')
    .select('id, status, lead_id, quote_number, leads!lead_quotes_lead_id_fkey(status)')
    .eq('public_uuid', uuid)
    .maybeSingle();
  if (!quote || !quote.lead_id) {
    return NextResponse.json({ ok: false, error: 'Preventivo non trovato.' }, { status: 404, headers });
  }
  const leadStatus = ((quote as Record<string, any>).leads || {}).status;
  const paid = ['paid', 'pending_activation', 'activated'].includes(quote.status as string);
  if (!paid && leadStatus !== 'in_verifica' && leadStatus !== 'trattativa') {
    return NextResponse.json({ ok: false, error: 'Disponibile dopo il pagamento.' }, { status: 403, headers });
  }
  if (leadStatus === 'attivato' || leadStatus === 'converted') {
    return NextResponse.json({ ok: false, error: 'Pratica già attivata.' }, { status: 409, headers });
  }

  let body: { pdf_base64?: string; fields?: Record<string, unknown> };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Body non valido' }, { status: 400, headers }); }

  const f = body.fields || {};
  const pdf = (body.pdf_base64 || '').replace(/^data:application\/pdf;base64,/, '');

  // 1) Salva la visura su R2 + lead_documents (se presente un PDF).
  if (pdf) {
    if (pdf.length > MAX_PDF_B64) {
      return NextResponse.json({ ok: false, error: 'PDF troppo grande (max ~10MB).' }, { status: 413, headers });
    }
    try {
      const buf = Buffer.from(pdf, 'base64');
      const key = `leads/${quote.lead_id}/visura/${quote.id}.pdf`;
      await uploadToR2(key, buf, 'application/pdf', { 'doc-type': 'visura', 'lead-id': String(quote.lead_id) });
      await supabaseAdmin.from('lead_documents').insert({
        lead_id: quote.lead_id,
        document_type: 'visura',
        file_name: `visura-${quote.quote_number || quote.id}.pdf`,
        storage_path: key,
        file_size_bytes: buf.length,
        mime_type: 'application/pdf',
        notes: 'Caricata dal cliente in onboarding',
      });
    } catch (err) {
      console.error('[visura/submit] R2 error:', err instanceof Error ? err.message : String(err));
      return NextResponse.json({ ok: false, error: 'Errore nel salvataggio della visura.' }, { status: 502, headers });
    }
  }

  // 2) Aggiorna i campi azienda sul lead con i valori CONFERMATI dal cliente.
  const leadPatch: Record<string, unknown> = {};
  const map: Record<string, string> = {
    ragione_sociale: 'company', partita_iva: 'vat_number', codice_fiscale: 'codice_fiscale',
    pec: 'pec', codice_ateco: 'codice_ateco', forma_giuridica: 'forma_giuridica',
    indirizzo: 'address_street', citta: 'address_city', provincia: 'address_province', cap: 'address_postal_code',
  };
  for (const [src, col] of Object.entries(map)) {
    const val = s(f[src]);
    if (val) leadPatch[col] = val;
  }
  if (Object.keys(leadPatch).length > 0) {
    await supabaseAdmin.from('leads').update(leadPatch).eq('id', quote.lead_id);
  }

  // 3) Assicura in_verifica (anche dopo una richiesta di correzione che riportava a trattativa).
  await supabaseAdmin.from('leads').update({ status: 'in_verifica' })
    .eq('id', quote.lead_id)
    .in('status', ['quote_sent', 'trattativa', 'in_verifica']);

  // Activity log (best-effort).
  try {
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: quote.lead_id, activity_type: 'verification_submitted',
      title: 'Pratica inviata in verifica',
      description: 'Il cliente ha caricato la visura e confermato i dati.',
      performed_by_type: 'customer', related_quote_id: quote.id,
    });
  } catch { /* non blocca */ }

  return NextResponse.json({ ok: true, status: 'in_verifica' }, { headers });
}
