import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    console.log('Staff migration API called');
    
    const supabase = supabaseAdmin;
    
    // Create staff users
    const staffUsers = [
      {
        email: 'admin@rescuemanager.eu',
        full_name: 'Admin Staff',
        staff_role: 'admin',
        is_staff: true,
        is_admin: true,
        provider: 'email'
      },
      {
        email: 'marketing@rescuemanager.eu',
        full_name: 'Marketing Staff',
        staff_role: 'marketing',
        is_staff: true,
        is_admin: false,
        provider: 'email'
      }
    ];
    
    const results = [];
    
    for (const user of staffUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, email, is_staff')
          .eq('email', user.email)
          .single();
        
        if (existingUser) {
          if (existingUser.is_staff) {
            results.push({
              email: user.email,
              status: 'already_staff',
              message: 'User already exists and is staff'
            });
            continue;
          } else {
            // Update existing user to be staff
            const { data: updatedUser, error: updateError } = await supabase
              .from('profiles')
              .update({
                is_staff: true,
                staff_role: user.staff_role,
                is_admin: user.is_admin,
                full_name: user.full_name,
                provider: user.provider
              })
              .eq('id', existingUser.id)
              .select()
              .single();
            
            if (updateError) {
              results.push({
                email: user.email,
                status: 'error',
                message: `Error updating user: ${updateError.message}`
              });
            } else {
              results.push({
                email: user.email,
                status: 'updated',
                message: 'User updated to staff'
              });
            }
            continue;
          }
        }
        
        // Create new staff user
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({
            ...user,
            id: randomUUID()
          })
          .select()
          .single();
        
        if (createError) {
          results.push({
            email: user.email,
            status: 'error',
            message: `Error creating user: ${createError.message}`
          });
        } else {
          results.push({
            email: user.email,
            status: 'created',
            message: 'User created successfully'
          });
        }
      } catch (error: any) {
        results.push({
          email: user.email,
          status: 'error',
          message: `Unexpected error: ${error.message}`
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Staff migration completed',
      results
    });
    
  } catch (error: any) {
    console.error('Staff migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
