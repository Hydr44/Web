import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;
    
    console.log(`Admin get organization API called for: ${orgId}`);
    
    // Carica organizzazione
    const { data: org, error: orgError } = await supabaseAdmin
      .from('orgs')
      .select('*')
      .eq('id', orgId)
      .single();
    
    if (orgError || !org) {
      return NextResponse.json({
        success: false,
        error: 'Organizzazione non trovata'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }
    
    // Conta membri
    const { count: memberCount } = await supabaseAdmin
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);
    
    const organization = {
      id: org.id,
      name: org.name,
      email: org.email || null,
      phone: org.phone || null,
      address: org.address || null,
      created_at: org.created_at,
      member_count: memberCount || 0,
      status: org.is_active !== false ? 'active' : 'inactive',
    };
    
    return NextResponse.json({
      success: true,
      organization
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin get organization API error:', error);
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
