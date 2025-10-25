import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email e password sono richiesti' 
      }, { status: 400 });
    }

    console.log('Staff auth API called for:', email);

    // Find user by email in auth.users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);

    if (!authUser) {
      console.log('Auth user not found:', email);
      return NextResponse.json({ 
        success: false, 
        error: 'Credenziali non valide' 
      }, { status: 401 });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.log('Profile not found:', profileError);
      return NextResponse.json({ 
        success: false, 
        error: 'Profilo utente non trovato' 
      }, { status: 401 });
    }

    // Check if user is staff
    if (!profile.is_staff) {
      console.log('User is not staff:', email);
      return NextResponse.json({ 
        success: false, 
        error: 'Accesso negato: utente non autorizzato' 
      }, { status: 403 });
    }

    // Create staff user object
    const user = {
      id: profile.id,
      email: profile.email || authUser.email || '',
      full_name: profile.full_name || '',
      staff_role: profile.staff_role || 'staff',
      is_staff: profile.is_staff,
      is_admin: profile.is_admin || false,
      last_login: new Date().toISOString(),
      created_at: profile.created_at,
      avatar_url: profile.avatar_url
    };

    console.log('Staff auth successful:', user);
    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error('Staff auth API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
