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
    
    console.log(`Admin get organization members API called for: ${orgId}`);
    
    // Carica membri con profili
    const { data: members, error: membersError } = await supabaseAdmin
      .from('org_members')
      .select(`
        user_id,
        role,
        created_at,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('org_id', orgId);
    
    if (membersError) {
      return NextResponse.json({
        success: false,
        error: 'Errore nel recupero membri'
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }
    
    // Trasforma i dati
    const formattedMembers = (members || []).map((member: any) => ({
      user_id: member.user_id,
      role: member.role,
      email: member.profiles?.email || null,
      full_name: member.profiles?.full_name || null,
      created_at: member.created_at,
    }));
    
    return NextResponse.json({
      success: true,
      members: formattedMembers
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin get organization members API error:', error);
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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;
    const { user_email, role } = await request.json();
    
    console.log(`Admin add organization member API called for: ${orgId}`);
    
    if (!user_email) {
      return NextResponse.json({
        success: false,
        error: 'Email utente richiesta'
      }, { 
        status: 400,
        headers: corsHeaders(origin)
      });
    }
    
    // Trova utente per email
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', user_email)
      .single();
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Utente non trovato'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }
    
    // Aggiungi membro
    const { data: member, error: memberError } = await supabaseAdmin
      .from('org_members')
      .insert({
        org_id: orgId,
        user_id: user.id,
        role: role || 'member'
      })
      .select()
      .single();
    
    if (memberError) {
      return NextResponse.json({
        success: false,
        error: memberError.message || 'Errore aggiunta membro'
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Membro aggiunto con successo',
      member
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin add organization member API error:', error);
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
