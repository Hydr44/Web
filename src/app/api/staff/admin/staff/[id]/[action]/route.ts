import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findProtectedStaffIds } from '@/lib/staff-protected';

const VALID_ROLES = ['super_admin', 'admin', 'marketing', 'sales', 'support', 'staff'];

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const { id: staffId, action } = params;

    console.log(`Performing action ${action} on staff ${staffId}`);

    // Guard account primario protetto: non eliminabile né sospendibile.
    if (action === 'delete' || action === 'suspend') {
      const prot = await findProtectedStaffIds([staffId]);
      if (prot.has(staffId)) {
        return NextResponse.json({
          success: false,
          error: 'Account primario protetto: non può essere eliminato o sospeso.',
        }, { status: 403 });
      }
    }

    let message;

    switch (action) {
      case 'view': {
        const { data: staffUser, error } = await supabaseAdmin
          .from('staff')
          .select('id, email, full_name, role, is_active, last_login_at, last_login_ip, created_at, updated_at')
          .eq('id', staffId)
          .single();

        if (error || !staffUser) {
          return NextResponse.json({
            success: false,
            error: 'Staff non trovato'
          }, { status: 404 });
        }

        // Sessioni attive (non scadute)
        const nowIso = new Date().toISOString();
        const { data: sessions } = await supabaseAdmin
          .from('staff_sessions')
          .select('id, ip_address, user_agent, created_at, expires_at')
          .eq('staff_id', staffId)
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false });

        // Ultime azioni dall'audit log
        const { data: auditLog } = await supabaseAdmin
          .from('staff_audit_log')
          .select('id, action, target_type, target_label, created_at')
          .eq('staff_id', staffId)
          .order('created_at', { ascending: false })
          .limit(15);

        return NextResponse.json({
          success: true,
          staff: staffUser,
          sessions: sessions || [],
          activity: auditLog || [],
        });
      }

      case 'reset-password': {
        const body = await request.json();
        const newPassword = String(body.password || '');
        if (newPassword.length < 8) {
          return NextResponse.json({
            success: false,
            error: 'La password deve essere di almeno 8 caratteri'
          }, { status: 400 });
        }
        const password_hash = await bcrypt.hash(newPassword, 10);
        const { error } = await supabaseAdmin
          .from('staff')
          .update({ password_hash, updated_at: new Date().toISOString() })
          .eq('id', staffId);

        if (error) {
          return NextResponse.json({
            success: false,
            error: `Errore reset password: ${error.message}`
          }, { status: 500 });
        }

        // Revoca tutte le sessioni esistenti per forzare il re-login
        await supabaseAdmin.from('staff_sessions').delete().eq('staff_id', staffId);

        message = 'Password reimpostata. Le sessioni attive sono state revocate.';
        break;
      }

      case 'revoke-sessions': {
        const { error } = await supabaseAdmin
          .from('staff_sessions')
          .delete()
          .eq('staff_id', staffId);

        if (error) {
          return NextResponse.json({
            success: false,
            error: `Errore revoca sessioni: ${error.message}`
          }, { status: 500 });
        }

        message = 'Tutte le sessioni attive sono state revocate';
        break;
      }

      case 'edit': {
        const body = await request.json();
        const { full_name, email, role } = body;

        if (role && !VALID_ROLES.includes(role)) {
          return NextResponse.json({
            success: false,
            error: `Ruolo non valido. Valori ammessi: ${VALID_ROLES.join(', ')}`
          }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('staff')
          .update({
            full_name,
            email,
            role,
            updated_at: new Date().toISOString()
          })
          .eq('id', staffId);

        if (error) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore aggiornamento staff: ${error.message}` 
          }, { status: 500 });
        }

        message = 'Staff aggiornato con successo';
        break;
      }

      case 'suspend': {
        const { error } = await supabaseAdmin
          .from('staff')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', staffId);

        if (error) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore sospensione staff: ${error.message}` 
          }, { status: 500 });
        }

        message = 'Staff sospeso con successo';
        break;
      }

      case 'activate': {
        const { error } = await supabaseAdmin
          .from('staff')
          .update({
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', staffId);

        if (error) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore attivazione staff: ${error.message}` 
          }, { status: 500 });
        }

        message = 'Staff attivato con successo';
        break;
      }

      case 'delete': {
        // Delete sessions first
        await supabaseAdmin
          .from('staff_sessions')
          .delete()
          .eq('staff_id', staffId);

        const { error } = await supabaseAdmin
          .from('staff')
          .delete()
          .eq('id', staffId);

        if (error) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore eliminazione staff: ${error.message}` 
          }, { status: 500 });
        }

        message = 'Staff eliminato con successo';
        break;
      }

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Azione non supportata' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message 
    });

  } catch (error: any) {
    console.error('Staff action API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
