import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const { id: staffId, action } = params;

    console.log(`Performing action ${action} on staff ${staffId}`);

    let message;

    switch (action) {
      case 'view': {
        const { data: staffUser, error } = await supabaseAdmin
          .from('staff')
          .select('id, email, full_name, role, is_active, last_login_at, created_at, updated_at')
          .eq('id', staffId)
          .single();

        if (error || !staffUser) {
          return NextResponse.json({ 
            success: false, 
            error: 'Staff non trovato' 
          }, { status: 404 });
        }

        return NextResponse.json({ 
          success: true, 
          staff: staffUser 
        });
      }

      case 'edit': {
        const body = await request.json();
        const { full_name, email, role } = body;
        
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
