/**
 * Lead Detail API
 * GET  /api/staff/admin/leads/:id - Dettaglio lead
 * PUT  /api/staff/admin/leads/:id - Aggiorna lead
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

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
      'priority', 'source', 'notes', 'assigned_to'
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

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
