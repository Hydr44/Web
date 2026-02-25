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
    
    // 1. Carica i record org_members (senza join — il join profiles:user_id fallisce silenziosamente)
    const { data: orgMembers, error: membersError } = await supabaseAdmin
      .from('org_members')
      .select('user_id, role, created_at')
      .eq('org_id', orgId);
    
    if (membersError) {
      console.error('Error fetching org_members:', membersError);
      return NextResponse.json({
        success: false,
        error: 'Errore nel recupero membri'
      }, { 
        status: 500,
        headers: corsHeaders(origin)
      });
    }
    
    // 2. Carica i profili separatamente e unisci manualmente
    const userIds = (orgMembers || []).map(m => m.user_id).filter(Boolean);
    let profilesMap: Record<string, { email: string | null; full_name: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      
      for (const p of (profiles || [])) {
        profilesMap[p.id] = { email: p.email, full_name: p.full_name };
      }
    }
    
    // 3. Combina i risultati
    const formattedMembers = (orgMembers || []).map((member: any) => {
      const profile = profilesMap[member.user_id];
      return {
        user_id: member.user_id,
        role: member.role,
        email: profile?.email || null,
        full_name: profile?.full_name || null,
        created_at: member.created_at,
      };
    });
    
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
