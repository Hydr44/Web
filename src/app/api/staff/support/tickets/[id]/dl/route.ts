/**
 * Sistema Supporto — download allegato (staff)
 * GET /api/staff/support/tickets/[id]/dl?key=support/<id>/...
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { signedAttachmentUrl } from '@/lib/support-attachments';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });

  const key = request.nextUrl.searchParams.get('key') || '';
  if (!key) return NextResponse.json({ success: false, error: 'key mancante' }, { status: 400 });

  const url = await signedAttachmentUrl(params.id, key);
  if (!url) return NextResponse.json({ success: false, error: 'Allegato non valido' }, { status: 400 });
  return NextResponse.redirect(url, 302);
}
