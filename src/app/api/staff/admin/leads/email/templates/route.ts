import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

/**
 * Default template di fabbrica (3 promo + 1 follow-up + 1 transazionale).
 * Vengono inseriti la prima volta che la lista risulta vuota, cosi' l'admin
 * trova subito qualcosa di utilizzabile invece della pagina "Nessun template".
 * Una volta inseriti possono essere modificati/eliminati come template normali.
 */
const DEFAULT_TEMPLATES = [
  {
    name: 'Promo Nuovo Cliente',
    category: 'promo',
    subject: 'Prova gratuita di RescueManager per 7 giorni',
    body: 'Gentile {{nome}},\n\nle offriamo 7 giorni di prova gratuita di RescueManager, il gestionale per autodemolizioni, soccorso stradale e trasporti.\n\nCon RescueManager puo gestire veicoli, ricambi e magazzino, inviare le fatture elettroniche, compilare il registro RENTRI e tenere la custodia dei veicoli sulla mappa.\n\nSe le interessa, risponda a questa email e attiviamo la prova.\n\nTeam RescueManager',
  },
  {
    name: 'Promo Sconto Annuale',
    category: 'promo',
    subject: 'Sconto del 20% sul piano annuale RescueManager',
    body: 'Gentile {{nome}},\n\nper un periodo limitato le offriamo il 20% di sconto sul piano annuale RescueManager.\n\nIl piano Enterprise passa da 149,99 euro al mese a 119,99 euro al mese.\n\nSe vuole approfittarne, risponda a questa email.\n\nTeam RescueManager',
  },
  {
    name: 'Follow-up Demo',
    category: 'follow_up',
    subject: 'Com\'e andata la demo di RescueManager',
    body: 'Gentile {{nome}},\n\nle scrivo per sapere se ha avuto modo di valutare la demo di RescueManager.\n\nSiamo a disposizione per rispondere alle sue domande, rivedere insieme i suoi casi o allungare il periodo di prova.\n\nMi faccia sapere.\n\nTeam RescueManager',
  },
  {
    name: 'Conferma Preventivo',
    category: 'transactional',
    subject: 'Preventivo RescueManager per {{azienda}}',
    body: 'Gentile {{nome}},\n\nin allegato trova il preventivo per {{azienda}}.\n\nIl documento vale 30 giorni dalla data di emissione. Per accettarlo puo seguire il collegamento contenuto nel PDF.\n\nResto a disposizione per chiarimenti.\n\nTeam RescueManager',
  },
  {
    name: 'Recupero Lead Freddo',
    category: 'reactivation',
    subject: 'Ci siamo persi qualcosa, {{nome}}',
    body: 'Gentile {{nome}},\n\nci eravamo sentiti tempo fa per RescueManager. Volevo verificare se la sua situazione e cambiata e se possiamo esserle utili.\n\nSe nel frattempo ha trovato altre soluzioni o non e piu interessato, risponda pure a questa email con "no grazie" e non la disturbiamo piu.\n\nUn cordiale saluto,\nTeam RescueManager',
  },
];

// GET - Lista template email (auto-seed la prima volta che la tabella e' vuota)
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    let { data: templates, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json({ success: true, templates: [] }, { headers: corsHeaders(origin) });
    }

    // Seed iniziale: se la tabella e' vuota inserisce i template di default
    if (!templates || templates.length === 0) {
      const { data: seeded, error: seedErr } = await supabaseAdmin
        .from('email_templates')
        .insert(DEFAULT_TEMPLATES)
        .select();
      if (!seedErr && seeded) templates = seeded;
    }

    return NextResponse.json({ success: true, templates: templates || [] }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

// POST - Crea/aggiorna template email
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const staff = await getStaffFromRequest(request as any);
    if (!staff) {
      return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
    }

    const body = await request.json();
    const { id, name, subject, body: templateBody, category } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json({ success: false, error: 'Nome, oggetto e corpo richiesti' }, { status: 400, headers: corsHeaders(origin) });
    }

    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('email_templates')
        .update({ name, subject, body: templateBody, category: category || 'general', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
      }
      return NextResponse.json({ success: true, template: data }, { headers: corsHeaders(origin) });
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from('email_templates')
        .insert({
          name,
          subject,
          body: templateBody,
          category: category || 'general',
          created_by: staff.sub,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
      }
      return NextResponse.json({ success: true, template: data }, { headers: corsHeaders(origin) });
    }
  } catch (error: any) {
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

// DELETE - Elimina template
export async function DELETE(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const staff = await getStaffFromRequest(request as any);
    if (!staff) {
      return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID richiesto' }, { status: 400, headers: corsHeaders(origin) });
    }

    await supabaseAdmin.from('email_templates').delete().eq('id', id);
    return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}
