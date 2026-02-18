import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    console.log('Updating profiles to staff...');
    
    const staffEmails = [
      'admin@rescuemanager.eu',
      'marketing@rescuemanager.eu', 
      'support@rescuemanager.eu'
    ];

    const results = [];

    for (const email of staffEmails) {
      try {
        // Find existing profile by email
        const { data: profile, error: findError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (findError || !profile) {
          results.push({
            email,
            status: 'error',
            message: 'Profile not found'
          });
          continue;
        }

        // Update profile to staff
        const staffRole = email === 'admin@rescuemanager.eu' ? 'admin' : 
                         email === 'marketing@rescuemanager.eu' ? 'marketing' : 'support';
        const isAdmin = email === 'admin@rescuemanager.eu';

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_staff: true,
            staff_role: staffRole,
            is_admin: isAdmin
          })
          .eq('id', profile.id);

        if (updateError) {
          results.push({
            email,
            status: 'error',
            message: `Update error: ${updateError.message}`
          });
          continue;
        }

        results.push({
          email,
          status: 'updated',
          message: 'Profile updated to staff'
        });

      } catch (error: any) {
        results.push({
          email,
          status: 'error',
          message: `Error: ${error.message}`
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profiles updated to staff', 
      results 
    });

  } catch (error: any) {
    console.error('Error updating profiles:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
