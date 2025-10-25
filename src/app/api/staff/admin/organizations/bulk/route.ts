import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { orgIds, action } = await request.json();

    if (!orgIds || !Array.isArray(orgIds) || orgIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lista organizzazioni richiesta' 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Azione richiesta' 
      }, { status: 400 });
    }

    console.log(`Performing bulk action ${action} on ${orgIds.length} organizations`);

    let result;
    let message;

    switch (action) {
      case 'activate':
        const { error: activateError } = await supabaseAdmin
          .from('organizations')
          .update({
            updated_at: new Date().toISOString()
          })
          .in('id', orgIds);

        if (activateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore attivazione organizzazioni: ${activateError.message}` 
          }, { status: 500 });
        }

        message = `${orgIds.length} organizzazioni attivate con successo`;
        break;

      case 'suspend':
        const { error: suspendError } = await supabaseAdmin
          .from('organizations')
          .update({
            updated_at: new Date().toISOString()
          })
          .in('id', orgIds);

        if (suspendError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore sospensione organizzazioni: ${suspendError.message}` 
          }, { status: 500 });
        }

        message = `${orgIds.length} organizzazioni sospese con successo`;
        break;

      case 'delete':
        // First remove all members from organizations
        await supabaseAdmin
          .from('org_members')
          .delete()
          .in('org_id', orgIds);

        // Update users' current_org to null
        await supabaseAdmin
          .from('profiles')
          .update({
            current_org: null,
            org_id: null
          })
          .in('current_org', orgIds);

        // Delete organizations
        const { error: deleteError } = await supabaseAdmin
          .from('organizations')
          .delete()
          .in('id', orgIds);

        if (deleteError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore eliminazione organizzazioni: ${deleteError.message}` 
          }, { status: 500 });
        }

        message = `${orgIds.length} organizzazioni eliminate con successo`;
        break;

      case 'export':
        // Get organization data for export
        const { data: organizations, error: exportError } = await supabaseAdmin
          .from('organizations')
          .select(`
            id,
            name,
            email,
            phone,
            address,
            city,
            created_at,
            updated_at,
            org_members (
              user_id,
              role,
              profiles (
                full_name,
                email
              )
            )
          `)
          .in('id', orgIds);

        if (exportError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore export organizzazioni: ${exportError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Dati organizzazioni preparati per export',
          organizations: organizations || []
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Azione bulk non supportata' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message,
      affectedCount: orgIds.length
    });

  } catch (error: any) {
    console.error('Bulk organizations API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
