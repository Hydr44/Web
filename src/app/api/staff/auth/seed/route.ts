import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { secret, email, password, full_name, role } = await req.json();

    // Verify admin secret
    const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.STAFF_JWT_SECRET;
    if (!secret || secret !== adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Secret non valido' },
        { status: 403 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Check if staff already exists
    const { data: existing } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Staff con questa email esiste già' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert staff
    const { data: staff, error } = await supabaseAdmin
      .from('staff')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash,
        full_name: full_name || '',
        role: role || 'super_admin',
        is_active: true,
      })
      .select('id, email, full_name, role')
      .single();

    if (error) {
      console.error('Staff seed error:', error);
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione dello staff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error: unknown) {
    console.error('Staff seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
