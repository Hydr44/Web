import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    console.log('Setting up staff users...');
    
    // Create staff users with specific credentials
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
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        });

        if (authError) {
          results.push({
            email: userData.email,
            status: 'error',
            message: `Auth error: ${authError.message}`
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
      message: 'Staff users setup completed', 
      results 
    });

  } catch (error: any) {
    console.error('Error setting up staff users:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
