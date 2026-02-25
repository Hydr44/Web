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

    // Check if profile already exists by email
    const { data: existingProfileByEmail, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, is_staff, staff_role')
      .eq('email', email)
      .single();

    console.log('Profile check result:', { existingProfileByEmail, profileCheckError });

    if (existingProfileByEmail) {
      if (existingProfileByEmail.is_staff) {
        return NextResponse.json({ 
          success: false, 
          error: 'Utente staff già esistente con questa email' 
        }, { status: 400 });
      } else {
        // Update existing profile to staff
        console.log('Updating existing profile to staff:', existingProfileByEmail.id);
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            staff_role,
            is_staff: true,
            is_admin: is_admin || false,
            full_name
          })
          .eq('id', existingProfileByEmail.id);

        if (updateError) {
          console.error('Update error:', updateError);
          return NextResponse.json({ 
            success: false, 
            error: `Errore aggiornamento profilo: ${updateError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Profilo esistente aggiornato a staff',
          user: {
            id: existingProfileByEmail.id,
            email,
            full_name,
            staff_role,
            is_staff: true,
            is_admin: is_admin || false
          }
        });
      }
    }

    // Check if auth user already exists
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === email);

    let authData;
    if (existingAuthUser) {
      console.log('Auth user already exists, using existing:', existingAuthUser.id);
      authData = { user: existingAuthUser };
    } else {
      // Create new auth user
      console.log('Creating new auth user for:', email);
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError || !newAuthData.user) {
        console.error('Auth creation error:', authError);
        return NextResponse.json({ 
          success: false, 
          error: `Errore creazione utente: ${authError?.message || 'Unknown error'}` 
        }, { status: 500 });
      }
      authData = newAuthData;
    }

    // Check if profile already exists for this auth user
    const { data: existingProfileById } = await supabaseAdmin
      .from('profiles')
      .select('id, is_staff')
      .eq('id', authData.user.id)
      .single();

    if (existingProfileById) {
      if (existingProfileById.is_staff) {
        return NextResponse.json({ 
          success: false, 
          error: 'Profilo staff già esistente per questo utente' 
        }, { status: 400 });
      } else {
        // Update existing profile to staff
        console.log('Updating existing profile to staff:', authData.user.id);
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            staff_role,
            is_staff: true,
            is_admin: is_admin || false,
            full_name,
            email
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          return NextResponse.json({ 
            success: false, 
            error: `Errore aggiornamento profilo: ${updateError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Profilo esistente aggiornato a staff',
          user: {
            id: authData.user.id,
            email,
            full_name,
            staff_role,
            is_staff: true,
            is_admin: is_admin || false
          }
        });
      }
    }

    // Create new profile
    console.log('Creating new profile for:', authData.user.id);
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
      if (!existingAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
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
