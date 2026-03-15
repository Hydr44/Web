import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

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
      name, email, phone, company, type, priority, source, notes,
      vat_number, codice_fiscale, pec, address_street, address_city,
      address_province, address_postal_code, forma_giuridica, codice_ateco
    } = body;
    
    if (!name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome richiesto' 
      }, { 
        status: 400,
        headers: corsHeaders(origin)
      });
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
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
      })
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
