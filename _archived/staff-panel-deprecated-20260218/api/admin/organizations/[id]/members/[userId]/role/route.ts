import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;
    const userId = params.userId;
    const { role } = await request.json();
    
    console.log(`Admin update organization member role API called for: ${orgId}, user: ${userId}, role: ${role}`);
    
    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Ruolo non valido'
      }, { 
        status: 400,
        headers: corsHeaders(origin)
      });
    }
    
    const { data: member, error: memberError } = await supabaseAdmin
      .from('org_members')
      .update({ role })
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (memberError) {
      return NextResponse.json({
        success: false,
        error: memberError.message || 'Errore aggiornamento ruolo'
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ruolo aggiornato con successo',
      member
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin update organization member role API error:', error);
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
