import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const staffId = params.id;
    
    console.log(`Admin get staff API called for: ${staffId}`);
    
    // Carica staff member
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();
    
    if (staffError || !staff) {
      return NextResponse.json({
        success: false,
        error: 'Staff non trovato'
      }, { 
        status: 404,
        headers: corsHeaders(origin)
      });
    }
    
    const staffUser = {
      id: staff.id,
      email: staff.email,
      full_name: staff.full_name,
      staff_role: staff.staff_role,
      is_staff: staff.is_staff,
      is_admin: staff.is_admin,
      created_at: staff.created_at,
      last_login: staff.last_login,
      status: staff.is_active !== false ? 'active' : 'inactive',
    };
    
    return NextResponse.json({
      success: true,
      user: staffUser
    }, {
      headers: corsHeaders(origin)
    });
    
  } catch (error: any) {
    console.error('Admin get staff API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { 
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}
