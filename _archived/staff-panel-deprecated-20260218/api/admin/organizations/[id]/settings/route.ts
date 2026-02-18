import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

// GET — leggi company_settings per org
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;

    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching company settings:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, settings: data || null },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin get company settings error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// PUT — crea o aggiorna company_settings per org
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;
    const body = await request.json();

    // Campi consentiti per aggiornamento da admin
    const allowedFields = [
      'company_name', 'company_code', 'legal_form',
      'vat_number', 'tax_code', 'fiscal_code', 'chamber_of_commerce',
      'email', 'phone', 'mobile', 'website', 'fax',
      'address_street', 'address_number', 'address_city',
      'address_province', 'address_postal_code', 'address_country', 'address_region',
      'operational_address_street', 'operational_address_number',
      'operational_address_city', 'operational_address_province',
      'operational_address_postal_code', 'operational_address_country',
      'logo_url', 'primary_color', 'secondary_color',
      'legal_notes', 'footer_text',
    ];

    // Filtra solo campi consentiti
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    updateData.updated_at = new Date().toISOString();

    // Controlla se esiste già
    const { data: existing } = await supabaseAdmin
      .from('company_settings')
      .select('id')
      .eq('org_id', orgId)
      .maybeSingle();

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('company_settings')
        .update(updateData)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating company settings:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders(origin) }
        );
      }
      result = data;
    } else {
      // Insert — richiede almeno company_name
      if (!updateData.company_name && !body.company_name) {
        return NextResponse.json(
          { success: false, error: 'company_name è obbligatorio per la creazione' },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      const { data, error } = await supabaseAdmin
        .from('company_settings')
        .insert({ org_id: orgId, ...updateData })
        .select()
        .single();

      if (error) {
        console.error('Error creating company settings:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders(origin) }
        );
      }
      result = data;
    }

    return NextResponse.json(
      { success: true, settings: result, message: 'Impostazioni aziendali aggiornate' },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin update company settings error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
