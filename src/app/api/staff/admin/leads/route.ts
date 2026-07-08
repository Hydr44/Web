import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { findDuplicateLead } from '@/lib/lead-dedup';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');
    
    console.log('Admin leads API called');
    
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ 
        success: true, 
        leads: [] 
      }, {
        headers: corsHeaders(origin)
      });
    }

    return NextResponse.json({ 
      success: true, 
      leads: leads || [] 
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin leads API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();
    
    const {
      // Anagrafica
      name, email, phone, company, type, priority, source, notes,
      // Azienda
      vat_number, codice_fiscale, pec, address_street, address_city,
      address_province, address_postal_code, forma_giuridica, codice_ateco,
      // v2 — qualificazione
      lifecycle_stage, lead_score, lead_temperature, tags,
      industry, company_size, vehicles_per_month, current_software, pain_points,
      // Attribution
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      referrer_url, landing_page, first_contact_channel,
      // Sales pipeline
      assigned_to, next_followup_at, next_followup_action,
      expected_close_date, expected_deal_value, probability_to_close,
      decision_timeline, decision_makers,
      // Primo contatto
      first_contact_at, first_contact_method, first_contact_notes,
      // Engagement preferences
      communication_preferences, preferred_contact_time,
      // Custom
      custom_fields,
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nome richiesto' }, { status: 400, headers: corsHeaders(origin) });
    }

    const insertPayload: Record<string, any> = {
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      type: type || 'contact',
      priority: priority || 'medium',
      source: source || 'admin',
      notes: notes || null,
      vat_number: vat_number || null,
      codice_fiscale: codice_fiscale || null,
      pec: pec || null,
      address_street: address_street || null,
      address_city: address_city || null,
      address_province: address_province || null,
      address_postal_code: address_postal_code || null,
      forma_giuridica: forma_giuridica || null,
      codice_ateco: codice_ateco || null,
    };

    // v2 fields — inseriti solo se presenti per non sovrascrivere defaults
    const v2 = {
      lifecycle_stage, lead_score, lead_temperature, tags,
      industry, company_size, vehicles_per_month, current_software, pain_points,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      referrer_url, landing_page, first_contact_channel,
      assigned_to, next_followup_at, next_followup_action,
      expected_close_date, expected_deal_value, probability_to_close,
      decision_timeline, decision_makers,
      first_contact_at, first_contact_method, first_contact_notes,
      communication_preferences, preferred_contact_time,
      custom_fields,
    };
    for (const [k, v] of Object.entries(v2)) {
      if (v !== undefined && v !== null && v !== '') insertPayload[k] = v;
    }

    // Anti-duplicati (Fase 0): blocco su email uguale, avviso su P.IVA/telefono.
    const dup = await findDuplicateLead(supabaseAdmin, { email, phone, vat_number });
    if (dup.exact) {
      return NextResponse.json({
        success: false,
        error: 'Esiste già un lead con questa email',
        duplicate: dup.exact,
      }, { status: 409, headers: corsHeaders(origin) });
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, {
        status: 500,
        headers: corsHeaders(origin)
      });
    }

    return NextResponse.json({
      success: true,
      lead,
      duplicate_warning: dup.soft || undefined,
      message: 'Lead creato con successo'
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin create lead API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}
