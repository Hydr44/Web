// Stato pratica (F5). PUBLIC, validato sul public_uuid. Usato da:
//   - pagina Stato Pratica (/pratica/[uuid]) come hub
//   - wizard (/configura/[uuid]) per la RIPRESA: deriva lo step dai dati persistiti
//     (no flag fragile: visura presente? lead in che stato?).
//   GET /api/quotes/[uuid]/pratica-status → { ok, paid, lead_status, has_visura, step, label }
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } },
) {
  const headers = corsHeaders(request.headers.get('origin'));

  const { data: quote } = await supabaseAdmin
    .from('lead_quotes')
    .select('id, status, lead_id, quote_number, leads!lead_quotes_lead_id_fkey(status, company, name)')
    .eq('public_uuid', params.uuid)
    .maybeSingle();
  if (!quote || !quote.lead_id) {
    return NextResponse.json({ ok: false, error: 'Pratica non trovata.' }, { status: 404, headers });
  }
  const lead = (quote as Record<string, any>).leads || {};
  const paid = ['paid', 'pending_activation', 'activated'].includes(quote.status as string);

  const { count } = await supabaseAdmin
    .from('lead_documents')
    .select('id', { count: 'exact', head: true })
    .eq('lead_id', quote.lead_id)
    .eq('document_type', 'visura');
  const hasVisura = (count || 0) > 0;

  // Deriva lo step dai dati reali (robusto alla ripresa).
  let step: 'pagamento' | 'carica' | 'in_verifica' | 'correzione' | 'attivato';
  let label: string;
  const ls = lead.status as string;
  if (ls === 'attivato' || ls === 'converted') {
    step = 'attivato'; label = 'Approvata — attivazione in corso';
  } else if (!paid) {
    step = 'pagamento'; label = 'In attesa di pagamento';
  } else if (ls === 'trattativa') {
    step = 'correzione'; label = 'Serve una correzione';
  } else if (hasVisura && ls === 'in_verifica') {
    step = 'in_verifica'; label = 'In verifica — esito entro 24 ore';
  } else {
    step = 'carica'; label = 'Configurazione da completare';
  }

  return NextResponse.json({
    ok: true,
    paid,
    lead_status: ls,
    has_visura: hasVisura,
    step,
    label,
    company: lead.company || lead.name || null,
    quote_number: quote.quote_number || null,
  }, { headers });
}
