import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    console.log('Creating profiles for existing auth users...');
    
    const staffUsers = [
      {
        email: 'admin@rescuemanager.eu',
        full_name: 'Admin Staff',
        staff_role: 'admin',
        is_admin: true
      },
      {
        email: 'marketing@rescuemanager.eu',
        full_name: 'Marketing Staff',
        staff_role: 'marketing',
        is_admin: false
      },
      {
        email: 'support@rescuemanager.eu',
        full_name: 'Support Staff',
        staff_role: 'support',
        is_admin: false
      }
    ];

    const results = [];

    for (const userData of staffUsers) {
      try {
        // Find auth user by email
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === userData.email);

        if (!authUser) {
          results.push({
            email: userData.email,
            status: 'error',
            message: 'Auth user not found'
          });
          continue;
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUser.id,
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
          message: 'Profile created successfully'
        });

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
      message: 'Profiles created for auth users', 
      results 
    });

  } catch (error: any) {
    console.error('Error creating profiles:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
