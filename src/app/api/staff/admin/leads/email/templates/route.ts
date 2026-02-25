import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';

// GET - Lista template email
export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');

    const { data: templates, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json({ success: true, templates: [] }, { headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, templates: templates || [] }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    const origin = request.headers.get('origin');
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
