import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const leadId = params.id;

    console.log(`Admin lead lose API called for: ${leadId}`);

    // Motivo di perdita (opzionale): validato contro l'enum a DB.
    const ALLOWED_LOST_REASONS = ['price', 'competitor', 'timing', 'not_fit', 'no_response', 'features', 'other'];
    let lost_reason: string | null = null;
    try {
      const body = await request.json();
      if (body?.lost_reason && ALLOWED_LOST_REASONS.includes(body.lost_reason)) {
        lost_reason = body.lost_reason;
      }
    } catch {
      // nessun body / body non-JSON → motivo non specificato
    }

    const updatePayload: Record<string, unknown> = {
      status: 'lost',
      lost_at: new Date().toISOString(),
    };
    if (lost_reason) updatePayload.lost_reason = lost_reason;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        success: false, 
        error: error?.message || 'Lead non trovato' 
      }, { 
        status: error ? 500 : 404,
        headers: corsHeaders(origin)
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead segnato come perso',
      lead: data
    }, {
      headers: corsHeaders(origin)
    });

  } catch (error: any) {
    console.error('Admin lead lose API error:', error);
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
