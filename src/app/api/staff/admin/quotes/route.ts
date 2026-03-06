import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');

    const { data: quotes, error } = await supabaseAdmin
      .from('admin_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, quotes: [] }, { headers: corsHeaders(origin) });
      }
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ success: true, quotes: [] }, { headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, quotes: quotes || [] }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    console.error('Admin quotes API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: true, quotes: [] }, { headers: corsHeaders(origin) });
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();

    const {
      client_name, client_email, client_company, client_phone,
      subject, items, subtotal, vat_rate, vat_amount, total,
      notes, valid_until, status,
    } = body;

    if (!client_name || !client_email) {
      return NextResponse.json({
        success: false, error: 'Nome e email cliente richiesti'
      }, { status: 400, headers: corsHeaders(origin) });
    }

    const { data: quote, error } = await supabaseAdmin
      .from('admin_quotes')
      .insert({
        client_name,
        client_email,
        client_company: client_company || null,
        client_phone: client_phone || null,
        subject: subject || 'Preventivo RescueManager',
        items: items || [],
        subtotal: subtotal || 0,
        vat_rate: vat_rate || 22,
        vat_amount: vat_amount || 0,
        total: total || 0,
        notes: notes || null,
        valid_until: valid_until || null,
        status: status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote:', error);
      return NextResponse.json({
        success: false, error: `Errore creazione preventivo: ${error.message}`
      }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({
      success: true, quote, message: 'Preventivo creato con successo'
    }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin create quote error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      success: false, error: 'Errore interno del server'
    }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
