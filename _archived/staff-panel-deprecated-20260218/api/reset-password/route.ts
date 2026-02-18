import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    console.log('Resetting password for existing staff user...');
    
    // Update password for existing staff user
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      '7ac7c007-0156-481d-9db1-bd9a098fb76b',
      {
        password: 'AdminStaff2024!'
      }
    );

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        error: `Password update error: ${updateError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully',
      credentials: {
        email: 'haxiesz@gmail.com',
        password: 'AdminStaff2024!'
      }
    });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
