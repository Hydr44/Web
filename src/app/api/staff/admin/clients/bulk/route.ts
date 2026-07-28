/**
 * POST /api/staff/admin/clients/:bulk
 * Azioni massive sui clienti (org). Pensato per pulizie di massa (es. account
 * di test). Ritorna sempre l'esito PER-ITEM così il frontend può mostrare
 * esattamente cosa è fallito e perché (niente fallimenti silenziosi).
 *
 * Body: { orgIds: string[], action: 'delete' | 'export' }
 *
 * Risposta:
 *   { success, summary: { total, successful, failed }, results: [{id, success, error?, data?}] }
 *
 * NB: `success` a livello top è true se la richiesta è stata processata; il
 * dettaglio dei fallimenti è in `summary.failed` / `results`. Il frontend DEVE
 * guardare summary.failed, non solo success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { deleteOrgCascade, exportOrgSnapshot } from '@/lib/admin-delete';

const MAX_BATCH = 500; // guardia: niente batch mostruosi in una singola richiesta

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers });
  }

  try {
    const { orgIds, action } = await request.json();

    if (!Array.isArray(orgIds) || orgIds.length === 0 || !action) {
      return NextResponse.json(
        { success: false, error: 'Parametri richiesti: orgIds (array non vuoto), action' },
        { status: 400, headers },
      );
    }
    if (orgIds.length > MAX_BATCH) {
      return NextResponse.json(
        { success: false, error: `Troppi elementi in un colpo (max ${MAX_BATCH}). Dividi la selezione.` },
        { status: 400, headers },
      );
    }
    if (action !== 'delete' && action !== 'export') {
      return NextResponse.json({ success: false, error: `Azione non supportata: ${action}` }, { status: 400, headers });
    }

    // Sequenziale: le delete cascade toccano molte tabelle, meglio non saturare
    // il pool di connessioni con 500 delete concorrenti.
    const results = [];
    for (const orgId of orgIds) {
      if (typeof orgId !== 'string' || !orgId) {
        results.push({ id: String(orgId), success: false, error: 'ID non valido' });
        continue;
      }
      results.push(action === 'delete' ? await deleteOrgCascade(orgId) : await exportOrgSnapshot(orgId));
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    return NextResponse.json(
      {
        success: true,
        message: `Operazione completata: ${successful} ok, ${failed} falliti`,
        summary: { total: orgIds.length, successful, failed },
        results,
      },
      { headers },
    );
  } catch (e: any) {
    console.error('[admin clients/bulk] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
