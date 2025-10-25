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

export async function POST(request: Request) {
  try {
    const { email, password, full_name, staff_role, is_admin } = await request.json();

    if (!email || !password || !full_name || !staff_role) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email, password, full_name e staff_role sono richiesti' 
      }, { status: 400 });
    }

    console.log('Creating staff user:', email);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ 
        success: false, 
        error: `Errore creazione utente: ${authError?.message || 'Unknown error'}` 
      }, { status: 500 });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        staff_role,
        is_staff: true,
        is_admin: is_admin || false,
        provider: 'email'
      });

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Profile creation error:', profileError);
      return NextResponse.json({ 
        success: false, 
        error: `Errore creazione profilo: ${profileError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Utente staff creato con successo',
      user: {
        id: authData.user.id,
        email,
        full_name,
        staff_role,
        is_staff: true,
        is_admin: is_admin || false
      }
    });

  } catch (error: any) {
    console.error('Staff user creation API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID utente è richiesto' 
      }, { status: 400 });
    }

    console.log('Deleting staff user:', id);

    // Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Auth deletion error:', authError);
      return NextResponse.json({ 
        success: false, 
        error: `Errore eliminazione utente: ${authError.message}` 
      }, { status: 500 });
    }

    // Delete from profiles (should cascade, but let's be explicit)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
      // Don't fail here as auth user is already deleted
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Utente staff eliminato con successo' 
    });

  } catch (error: any) {
    console.error('Staff user deletion API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
