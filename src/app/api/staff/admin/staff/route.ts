import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createAuditLog } from '@/lib/staff-audit';

export async function GET() {
  try {
    console.log('Admin staff API called');
    
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        staff_role,
        is_admin,
        created_at,
        updated_at,
        is_staff
      `)
      .eq('is_staff', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff users:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel recupero degli utenti staff' 
      }, { status: 500 });
    }

    // Transform data to include additional staff information
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      staff_role: user.staff_role,
      is_admin: user.is_admin,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.updated_at, // Use updated_at as last_login for now
      status: 'active', // Default status
      permissions: [], // Will be populated based on role
      session_count: Math.floor(Math.random() * 5) + 1, // Mock session count
      total_actions: Math.floor(Math.random() * 100) + 10 // Mock total actions
    })) || [];

    return NextResponse.json({ 
      success: true, 
      users: transformedUsers 
    });

  } catch (error: any) {
    console.error('Admin staff API error:', error);
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

        // Log audit
        await createAuditLog(
          'system',
          'System',
          'system',
          'staff.create',
          'staff_user',
          existingProfileByEmail.id,
          full_name,
          { staff_role, is_admin },
          request,
          true
        );

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

        // Log audit
        await createAuditLog(
          'system',
          'System',
          'system',
          'staff.create',
          'staff_user',
          authData.user.id,
          full_name,
          { staff_role, is_admin },
          request,
          true
        );

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

    // Log audit
    await createAuditLog(
      'system',
      'System',
      'system',
      'staff.create',
      'staff_user',
      authData.user.id,
      full_name,
      { staff_role, is_admin },
      request,
      true
    );

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
