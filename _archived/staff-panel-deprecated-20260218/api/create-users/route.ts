import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    console.log('Creating staff users...');
    
    const staffUsers = [
      {
        email: 'admin@rescuemanager.eu',
        password: 'AdminStaff2024!',
        full_name: 'Admin Staff',
        staff_role: 'admin',
        is_admin: true
      },
      {
        email: 'marketing@rescuemanager.eu',
        password: 'MarketingStaff2024!',
        full_name: 'Marketing Staff',
        staff_role: 'marketing',
        is_admin: false
      },
      {
        email: 'support@rescuemanager.eu',
        password: 'SupportStaff2024!',
        full_name: 'Support Staff',
        staff_role: 'support',
        is_admin: false
      }
    ];

    const results = [];

    for (const userData of staffUsers) {
      try {
        // First, try to find existing auth user
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users?.find(u => u.email === userData.email);

        if (existingAuthUser) {
          // User exists in auth, check if profile exists
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, is_staff')
            .eq('id', existingAuthUser.id)
            .single();

          if (existingProfile) {
            // Profile exists, update to staff
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({
                is_staff: true,
                staff_role: userData.staff_role,
                is_admin: userData.is_admin
              })
              .eq('id', existingProfile.id);

            if (updateError) {
              results.push({
                email: userData.email,
                status: 'error',
                message: `Update error: ${updateError.message}`
              });
              continue;
            }

            results.push({
              email: userData.email,
              status: 'updated',
              message: 'Profile updated to staff'
            });
          } else {
            // Profile doesn't exist, create it
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: existingAuthUser.id,
                email: userData.email,
                full_name: userData.full_name,
                staff_role: userData.staff_role,
                is_staff: true,
                is_admin: userData.is_admin,
                provider: 'email'
              });

            if (profileError) {
              results.push({
                email: userData.email,
                status: 'error',
                message: `Profile creation error: ${profileError.message}`
              });
              continue;
            }

            results.push({
              email: userData.email,
              status: 'created',
              message: 'Profile created for existing auth user'
            });
          }
        } else {
          // No auth user exists, create both
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true
          });

          if (authError || !authData.user) {
            results.push({
              email: userData.email,
              status: 'error',
              message: `Auth error: ${authError?.message || 'Unknown error'}`
            });
            continue;
          }

          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: userData.email,
              full_name: userData.full_name,
              staff_role: userData.staff_role,
              is_staff: true,
              is_admin: userData.is_admin,
              provider: 'email'
            });

          if (profileError) {
            // Clean up auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            results.push({
              email: userData.email,
              status: 'error',
              message: `Profile error: ${profileError.message}`
            });
            continue;
          }

          results.push({
            email: userData.email,
            status: 'created',
            message: 'User created successfully'
          });
        }

      } catch (error: any) {
        results.push({
          email: userData.email,
          status: 'error',
          message: `Error: ${error.message}`
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Staff users creation completed', 
      results 
    });

  } catch (error: any) {
    console.error('Error creating staff users:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
