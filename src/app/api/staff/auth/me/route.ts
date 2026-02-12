import { NextRequest, NextResponse } from 'next/server';
import { getStaffFromRequest } from '@/lib/staff-auth';

export async function GET(req: NextRequest) {
  try {
    const staff = await getStaffFromRequest(req);

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Non autenticato' },
        { status: 401 }
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
    });
  } catch (error: unknown) {
    console.error('Staff me error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
