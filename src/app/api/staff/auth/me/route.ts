import { NextRequest, NextResponse } from 'next/server';
import { getStaffFromRequest } from '@/lib/staff-auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const staff = await getStaffFromRequest(req);

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.sub,
        email: staff.email,
        full_name: staff.full_name,
        role: staff.role,
      },
    }, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Staff me error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders }
    );
  }
}
