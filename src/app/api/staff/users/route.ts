import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Staff users API called');
    
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, is_staff, staff_role, is_admin, created_at, avatar_url')
      .eq('is_staff', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel recupero degli utenti' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      users: users || [] 
    });

  } catch (error: any) {
    console.error('Staff users API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
