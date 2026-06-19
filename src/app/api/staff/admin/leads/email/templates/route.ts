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
    subject: 'Prova RescueManager gratis per 7 giorni!',
    body: 'Gentile {{nome}},\n\nle offriamo 7 giorni di prova gratuita di RescueManager, la piattaforma n.1 per autodemolizioni.\n\nCon RescueManager puo:\n- Gestire veicoli, ricambi e magazzino\n- Inviare fatture elettroniche via SDI\n- Compilare registri RENTRI in automatico\n- Gestire la custodia veicoli con mappa interattiva\n\nAttivi subito la prova gratuita!\n\nTeam RescueManager',
  },
  {
    name: 'Promo Sconto Annuale',
    category: 'promo',
    subject: 'Sconto 20% sul piano annuale RescueManager',
    body: 'Gentile {{nome}},\n\nper un tempo limitato, le offriamo il 20% di sconto sul piano annuale RescueManager.\n\nPiano Enterprise a soli 119.99 EUR/mese (invece di 149.99 EUR).\n\nApprofitti subito dell\'offerta!\n\nTeam RescueManager',
  },
  {
    name: 'Follow-up Demo',
    category: 'follow_up',
    subject: 'Come e andata la demo di RescueManager?',
    body: 'Gentile {{nome}},\n\nla contatto per sapere se ha avuto modo di valutare la demo di RescueManager.\n\nSiamo a disposizione per:\n- Rispondere a qualsiasi domanda\n- Organizzare una sessione personalizzata\n- Attivare un periodo di prova esteso\n\nNon esiti a contattarci!\n\nTeam RescueManager',
  },
  {
    name: 'Conferma Preventivo',
    category: 'transactional',
    subject: 'Il suo preventivo RescueManager per {{azienda}}',
    body: 'Gentile {{nome}},\n\nin allegato trova il preventivo richiesto per {{azienda}}.\n\nIl documento e valido 30 giorni dalla data di emissione. Per accettarlo le basta seguire il link contenuto nel PDF.\n\nResto a disposizione per chiarimenti.\n\nTeam RescueManager',
  },
  {
    name: 'Recupero Lead Freddo',
    category: 'reactivation',
    subject: 'Ci siamo persi qualcosa, {{nome}}?',
    body: 'Gentile {{nome}},\n\nci eravamo sentiti tempo fa riguardo RescueManager. Volevo solo verificare se la sua situazione e cambiata e se possiamo esserle utili.\n\nSe nel frattempo ha trovato altre soluzioni o non e piu interessato, le basta rispondere a questa mail con "no grazie" e non la disturberemo piu.\n\nUn cordiale saluto,\nTeam RescueManager',
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
