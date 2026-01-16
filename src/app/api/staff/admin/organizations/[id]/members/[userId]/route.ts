import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;
    const userId = params.userId;
    
    console.log(`Admin remove organization member API called for: ${orgId}, user: ${userId}`);
    
    const { error } = await supabaseAdmin
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message || 'Errore rimozione membro'
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Membro rimosso con successo'
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin remove organization member API error:', error);
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
