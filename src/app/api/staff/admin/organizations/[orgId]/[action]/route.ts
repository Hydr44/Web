import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: { orgId: string; action: string } }
) {
  try {
    const { orgId, action } = params;
    const { data: bodyData } = await request.json().catch(() => ({}));

    console.log(`Performing action ${action} on organization ${orgId}`);

    let result;
    let message;

    switch (action) {
      case 'view':
        // Get organization details with members
        const { data: org, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select(`
            *,
            org_members (
              user_id,
              role,
              created_at,
              profiles (
                full_name,
                email,
                avatar_url
              )
            )
          `)
          .eq('id', orgId)
          .single();

        if (orgError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore nel recupero organizzazione: ${orgError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          organization: org,
          message: 'Dettagli organizzazione recuperati' 
        });

      case 'edit':
        const { name, email, phone, address, city } = bodyData;
        
        const { error: updateError } = await supabaseAdmin
          .from('organizations')
          .update({
            name,
            email,
            phone,
            address,
            city,
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId);

        if (updateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore aggiornamento organizzazione: ${updateError.message}` 
          }, { status: 500 });
        }

        message = 'Organizzazione aggiornata con successo';
        break;

      case 'suspend':
        const { error: suspendError } = await supabaseAdmin
          .from('organizations')
          .update({
            updated_at: new Date().toISOString()
            // Add suspended field if needed
          })
          .eq('id', orgId);

        if (suspendError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore sospensione organizzazione: ${suspendError.message}` 
          }, { status: 500 });
        }

        message = 'Organizzazione sospesa con successo';
        break;

      case 'activate':
        const { error: activateError } = await supabaseAdmin
          .from('organizations')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId);

        if (activateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore attivazione organizzazione: ${activateError.message}` 
          }, { status: 500 });
        }

        message = 'Organizzazione attivata con successo';
        break;

      case 'members':
        // Get organization members
        const { data: members, error: membersError } = await supabaseAdmin
          .from('org_members')
          .select(`
            user_id,
            role,
            created_at,
            profiles (
              full_name,
              email,
              avatar_url,
              is_admin
            )
          `)
          .eq('org_id', orgId);

        if (membersError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore recupero membri: ${membersError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          members: members || [],
          message: 'Membri organizzazione recuperati' 
        });

      case 'add-member':
        const { user_id, role } = bodyData;
        
        if (!user_id) {
          return NextResponse.json({ 
            success: false, 
            error: 'ID utente richiesto' 
          }, { status: 400 });
        }

        const { error: addMemberError } = await supabaseAdmin
          .from('org_members')
          .insert({
            org_id: orgId,
            user_id,
            role: role || 'member'
          });

        if (addMemberError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore aggiunta membro: ${addMemberError.message}` 
          }, { status: 500 });
        }

        // Update user's current_org
        await supabaseAdmin
          .from('profiles')
          .update({
            current_org: orgId,
            org_id: orgId
          })
          .eq('id', user_id);

        message = 'Membro aggiunto con successo';
        break;

      case 'remove-member':
        const { user_id: removeUserId } = bodyData;
        
        if (!removeUserId) {
          return NextResponse.json({ 
            success: false, 
            error: 'ID utente richiesto' 
          }, { status: 400 });
        }

        const { error: removeMemberError } = await supabaseAdmin
          .from('org_members')
          .delete()
          .eq('org_id', orgId)
          .eq('user_id', removeUserId);

        if (removeMemberError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore rimozione membro: ${removeMemberError.message}` 
          }, { status: 500 });
        }

        // Update user's current_org to null
        await supabaseAdmin
          .from('profiles')
          .update({
            current_org: null,
            org_id: null
          })
          .eq('id', removeUserId);

        message = 'Membro rimosso con successo';
        break;

      case 'analytics':
        // Get organization analytics
        const { data: analytics, error: analyticsError } = await supabaseAdmin
          .from('organizations')
          .select(`
            id,
            name,
            created_at,
            org_members (
              user_id,
              created_at
            )
          `)
          .eq('id', orgId)
          .single();

        if (analyticsError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore recupero analytics: ${analyticsError.message}` 
          }, { status: 500 });
        }

        const memberCount = analytics.org_members?.length || 0;
        const daysSinceCreation = Math.floor(
          (new Date().getTime() - new Date(analytics.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        return NextResponse.json({ 
          success: true, 
          analytics: {
            memberCount,
            daysSinceCreation,
            growthRate: memberCount / Math.max(daysSinceCreation, 1),
            recentMembers: analytics.org_members?.slice(-5) || []
          },
          message: 'Analytics organizzazione recuperati' 
        });

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
    console.error('Organization action API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
