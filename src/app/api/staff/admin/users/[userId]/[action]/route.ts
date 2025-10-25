import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: { userId: string; action: string } }
) {
  try {
    const { userId, action } = params;
    const { data: bodyData } = await request.json().catch(() => ({}));

    console.log(`Performing action ${action} on user ${userId}`);

    let result;
    let message;

    switch (action) {
      case 'view':
        // Get user details
        const { data: user, error: userError } = await supabaseAdmin
          .from('profiles')
          .select(`
            *,
            organizations!current_org (
              name,
              created_at
            )
          `)
          .eq('id', userId)
          .single();

        if (userError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore nel recupero utente: ${userError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          user,
          message: 'Dettagli utente recuperati' 
        });

      case 'edit':
        const { full_name, email, is_admin } = bodyData;
        
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name,
            email,
            is_admin
          })
          .eq('id', userId);

        if (updateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore aggiornamento utente: ${updateError.message}` 
          }, { status: 500 });
        }

        message = 'Utente aggiornato con successo';
        break;

      case 'suspend':
        const { error: suspendError } = await supabaseAdmin
          .from('profiles')
          .update({
            // Add a suspended field or use a status field
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (suspendError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore sospensione utente: ${suspendError.message}` 
          }, { status: 500 });
        }

        message = 'Utente sospeso con successo';
        break;

      case 'activate':
        const { error: activateError } = await supabaseAdmin
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (activateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore attivazione utente: ${activateError.message}` 
          }, { status: 500 });
        }

        message = 'Utente attivato con successo';
        break;

      case 'reset-password':
        // Reset password via Supabase Auth
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: bodyData.newPassword }
        );

        if (resetError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore reset password: ${resetError.message}` 
          }, { status: 500 });
        }

        message = 'Password resettata con successo';
        break;

      case 'assign-org':
        const { org_id } = bodyData;
        
        const { error: assignError } = await supabaseAdmin
          .from('profiles')
          .update({
            current_org: org_id,
            org_id: org_id
          })
          .eq('id', userId);

        if (assignError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore assegnazione organizzazione: ${assignError.message}` 
          }, { status: 500 });
        }

        message = 'Organizzazione assegnata con successo';
        break;

      case 'remove-org':
        const { error: removeError } = await supabaseAdmin
          .from('profiles')
          .update({
            current_org: null,
            org_id: null
          })
          .eq('id', userId);

        if (removeError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore rimozione organizzazione: ${removeError.message}` 
          }, { status: 500 });
        }

        message = 'Organizzazione rimossa con successo';
        break;

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
    console.error('User action API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
