/**
 * Lead Detail API
 * GET  /api/staff/admin/leads/:id - Dettaglio lead
 * PUT  /api/staff/admin/leads/:id - Aggiorna lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead non trovato' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, lead },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Errore interno' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();

    const allowedFields = [
      'name', 'email', 'phone', 'company', 'type', 'status',
      'priority', 'source', 'notes', 'assigned_to', 'assigned_staff_id',
      'vat_number', 'codice_fiscale', 'pec',
      'address_street', 'address_city', 'address_province', 'address_postal_code',
      'forma_giuridica', 'codice_ateco'
    ];

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, lead, message: 'Lead aggiornato' },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Errore interno' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

/**
 * DELETE /api/staff/admin/leads/:id
 * Elimina il lead e TUTTI i record correlati nella pipeline (task, messaggi,
 * preventivi, demo, attivita, appuntamenti, note). NON tocca eventuali utenti
 * o organizzazioni create da una conversione (quelli si gestiscono dal modulo
 * Clienti).
 *
 * Ordine: figlie prima -> padre per ultimo (alcune FK non hanno ON DELETE CASCADE).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  // Auth: solo staff loggati possono eliminare un lead
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers });
  }

  try {
    const leadId = params.id;

    // Verifica esistenza
    const { data: lead, error: fetchErr } = await supabaseAdmin
      .from('leads')
      .select('id, name, demo_account_id, demo_org_id')
      .eq('id', leadId)
      .maybeSingle();

    if (fetchErr || !lead) {
      return NextResponse.json({ success: false, error: 'Lead non trovato' }, { status: 404, headers });
    }

    // Cascade manuale: tabelle figlie (best-effort, ignoriamo errori "tabella
    // non esiste" che alcune migrazioni potrebbero non aver applicato)
    const childTables = [
      'lead_tasks',
      'lead_messages',
      'lead_quotes',
      'lead_demos',
      'lead_activities',
      'lead_appointments',
      'lead_notes',
    ];

    for (const table of childTables) {
      const { error } = await supabaseAdmin.from(table).delete().eq('lead_id', leadId);
      // 42P01 = relation does not exist (tabella opzionale non applicata)
      if (error && error.code !== '42P01') {
        console.warn(`[lead delete] tabella ${table}:`, error.message);
      }
    }

    // email_campaigns ha ON DELETE SET NULL nella migration, lo rendiamo esplicito
    await supabaseAdmin.from('email_campaigns').update({ lead_id: null }).eq('lead_id', leadId);

    // BUGFIX: orgs.converted_from_lead_id ha FK verso leads(id) SENZA ON DELETE
    // (= NO ACTION) → un lead già convertito in cliente era BLOCCATO in delete
    // (23503) e falliva "senza motivo". Nullifichiamo il puntatore dall'org
    // (il cliente resta, si gestisce da Clienti) così il lead è eliminabile.
    await supabaseAdmin.from('orgs').update({ converted_from_lead_id: null }).eq('converted_from_lead_id', leadId);

    // Lead stesso
    const { error: deleteErr } = await supabaseAdmin.from('leads').delete().eq('id', leadId);
    if (deleteErr) {
      return NextResponse.json({
        success: false,
        error: `Errore eliminazione lead: ${deleteErr.message}`,
      }, { status: 500, headers });
    }

    return NextResponse.json({
      success: true,
      message: `Lead "${lead.name}" eliminato (incluse tutte le attivita collegate)`,
      had_demo: !!lead.demo_account_id,
    }, { headers });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Errore interno',
    }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
