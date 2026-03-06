import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const { data: quote, error } = await supabaseAdmin
      .from('admin_quotes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, quote }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();

    const { data: quote, error } = await supabaseAdmin
      .from('admin_quotes')
      .update({
        client_name: body.client_name,
        client_email: body.client_email,
        client_company: body.client_company || null,
        client_phone: body.client_phone || null,
        subject: body.subject,
        items: body.items || [],
        subtotal: body.subtotal || 0,
        vat_rate: body.vat_rate || 22,
        vat_amount: body.vat_amount || 0,
        total: body.total || 0,
        notes: body.notes || null,
        valid_until: body.valid_until || null,
        status: body.status || 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, quote, message: 'Preventivo aggiornato' }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');

    const { error } = await supabaseAdmin
      .from('admin_quotes')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, message: 'Preventivo eliminato' }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
