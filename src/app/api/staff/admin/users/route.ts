import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Admin users API called');
    
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at,
        is_admin,
        current_org
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel recupero degli utenti' 
      }, { status: 500 });
    }

    // Transform data to include organization name and status
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_admin: user.is_admin,
      current_org: user.current_org,
      org_name: user.current_org ? 'Organizzazione Attiva' : 'Nessuna Organizzazione',
      last_active: user.updated_at,
      status: 'active' // Default status, can be enhanced later
    })) || [];

    return NextResponse.json({ 
      success: true, 
      users: transformedUsers 
    });

  } catch (error: any) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
