import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from './supabase-admin';
import { NextRequest } from 'next/server';

const STAFF_JWT_SECRET = new TextEncoder().encode(
  process.env.STAFF_JWT_SECRET || process.env.ADMIN_SECRET_KEY || 'staff-secret-change-me'
);
const JWT_ISSUER = 'rescuemanager-admin';
const JWT_EXPIRY = '24h';

export interface StaffPayload {
  sub: string;       // staff.id
  email: string;
  role: string;
  full_name: string;
}

export async function generateStaffToken(staff: StaffPayload): Promise<string> {
  return new SignJWT({
    email: staff.email,
    role: staff.role,
    full_name: staff.full_name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(staff.sub)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(STAFF_JWT_SECRET);
}

export async function verifyStaffToken(token: string): Promise<StaffPayload | null> {
  try {
    const { payload } = await jwtVerify(token, STAFF_JWT_SECRET, {
      issuer: JWT_ISSUER,
    });

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      full_name: payload.full_name as string,
    };
  } catch {
    return null;
  }
}

export async function getStaffFromRequest(req: NextRequest): Promise<StaffPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const payload = await verifyStaffToken(token);
  if (!payload) return null;

  // Verify staff still exists and is active
  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('id, is_active')
    .eq('id', payload.sub)
    .single();

  if (!staff || !staff.is_active) return null;

  return payload;
}

export function requireStaffRole(staff: StaffPayload, ...roles: string[]): boolean {
  if (staff.role === 'super_admin') return true;
  return roles.includes(staff.role);
}
