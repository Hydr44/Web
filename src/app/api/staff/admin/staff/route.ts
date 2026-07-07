import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createAuditLog } from '@/lib/staff-audit';

const VALID_ROLES = ['super_admin', 'admin', 'marketing', 'sales', 'support', 'staff'] as const;
type StaffRole = (typeof VALID_ROLES)[number];

export async function GET() {
  try {
    // Conteggio sessioni attive per arricchire la lista
    const { data: staffUsers, error } = await supabaseAdmin
      .from('staff')
      .select('id, email, full_name, role, is_active, status, email_verified_at, last_login_at, last_login_ip, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff users:', error);
      return NextResponse.json({
        success: false,
        error: 'Errore nel recupero degli utenti staff'
      }, { status: 500 });
    }

    // Sessioni attive (non scadute) per ogni staff
    const nowIso = new Date().toISOString();
    const { data: sessions } = await supabaseAdmin
      .from('staff_sessions')
      .select('staff_id')
      .gt('expires_at', nowIso);

    const sessionCount = new Map<string, number>();
    for (const s of sessions || []) {
      sessionCount.set(s.staff_id, (sessionCount.get(s.staff_id) || 0) + 1);
    }

    const transformedUsers = (staffUsers || []).map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: null,
      staff_role: user.role,
      is_admin: user.role === 'super_admin' || user.role === 'admin',
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login_at,
      last_login_ip: user.last_login_ip,
      status: user.is_active ? 'active' : 'inactive',
      // Ciclo di vita reale (invited/active/suspended) per distinguere gli
      // inviti in sospeso dagli account attivi nell'UI.
      account_status: user.status || (user.is_active ? 'active' : 'suspended'),
      email_verified: !!user.email_verified_at,
      session_count: sessionCount.get(user.id) || 0,
      total_actions: 0
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers
    });

  } catch (error: any) {
    console.error('Admin staff API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const full_name = String(body.full_name || '').trim();
    // accetta sia `staff_role` (legacy frontend) sia `role`
    const roleInput = String(body.staff_role || body.role || '').trim();

    if (!email || !password || !full_name || !roleInput) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, nome completo e ruolo sono richiesti'
      }, { status: 400 });
    }

    if (!VALID_ROLES.includes(roleInput as StaffRole)) {
      return NextResponse.json({
        success: false,
        error: `Ruolo non valido. Valori ammessi: ${VALID_ROLES.join(', ')}`
      }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'La password deve essere di almeno 8 caratteri'
      }, { status: 400 });
    }

    // Email gia' usata?
    const { data: existing } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Esiste gia un utente staff con questa email'
      }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: created, error: insertError } = await supabaseAdmin
      .from('staff')
      .insert({
        email,
        password_hash,
        full_name,
        role: roleInput,
        is_active: true,
      })
      .select('id, email, full_name, role, is_active, created_at')
      .single();

    if (insertError || !created) {
      console.error('Staff insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: `Errore creazione staff: ${insertError?.message || 'sconosciuto'}`
      }, { status: 500 });
    }

    await createAuditLog(
      'system',
      'System',
      'system',
      'staff.create',
      'staff_user',
      created.id,
      full_name,
      { role: roleInput },
      request,
      true
    );

    return NextResponse.json({
      success: true,
      message: 'Utente staff creato con successo',
      user: {
        id: created.id,
        email: created.email,
        full_name: created.full_name,
        staff_role: created.role,
        is_admin: created.role === 'super_admin' || created.role === 'admin',
        status: created.is_active ? 'active' : 'inactive',
        created_at: created.created_at,
      }
    });

  } catch (error: any) {
    console.error('Staff user creation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}
