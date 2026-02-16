import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { orgIds, action, data } = await request.json();

    if (!orgIds || !Array.isArray(orgIds) || orgIds.length === 0 || !action) {
      return NextResponse.json({
        success: false,
        error: 'Parametri richiesti: orgIds (array), action (string)'
      }, { status: 400 });
    }

    console.log(`Bulk organization action: ${action} for ${orgIds.length} organizations`);

    const results: { id: string; success: boolean; error?: string }[] = [];

    switch (action) {
      case 'activate': {
        for (const orgId of orgIds) {
          try {
            const { error } = await supabaseAdmin
              .from('orgs')
              .update({
                updated_at: new Date().toISOString()
              })
              .eq('id', orgId);

            if (error) {
              results.push({ id: orgId, success: false, error: error.message });
            } else {
              results.push({ id: orgId, success: true });
            }
          } catch (err: any) {
            results.push({ id: orgId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'suspend': {
        for (const orgId of orgIds) {
          try {
            const { error } = await supabaseAdmin
              .from('orgs')
              .update({
                updated_at: new Date().toISOString()
              })
              .eq('id', orgId);

            if (error) {
              results.push({ id: orgId, success: false, error: error.message });
            } else {
              results.push({ id: orgId, success: true });
            }
          } catch (err: any) {
            results.push({ id: orgId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'delete': {
        for (const orgId of orgIds) {
          try {
            // First, remove all members from the organization
            const { error: membersError } = await supabaseAdmin
              .from('org_members')
              .delete()
              .eq('org_id', orgId);

            if (membersError) {
              results.push({ id: orgId, success: false, error: `Errore rimozione membri: ${membersError.message}` });
              continue;
            }

            // Then delete the organization
            const { error: orgError } = await supabaseAdmin
              .from('orgs')
              .delete()
              .eq('id', orgId);

            if (orgError) {
              results.push({ id: orgId, success: false, error: `Errore eliminazione: ${orgError.message}` });
            } else {
              results.push({ id: orgId, success: true });
            }
          } catch (err: any) {
            results.push({ id: orgId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'export': {
        // Export organization data
        for (const orgId of orgIds) {
          try {
            const { data: org, error: orgError } = await supabaseAdmin
              .from('orgs')
              .select('*')
              .eq('id', orgId)
              .single();

            if (orgError) {
              results.push({ id: orgId, success: false, error: orgError.message });
            } else {
              // Get members for this org
              const { data: members } = await supabaseAdmin
                .from('org_members')
                .select(`
                  role,
                  created_at,
                  profiles!inner (
                    email,
                    full_name
                  )
                `)
                .eq('org_id', orgId);

              results.push({ 
                id: orgId, 
                success: true, 
                data: {
                  organization: org,
                  members: members || []
                }
              });
            }
          } catch (err: any) {
            results.push({ id: orgId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'merge': {
        const { target_org_id } = data || {};
        
        if (!target_org_id) {
          return NextResponse.json({
            success: false,
            error: 'ID organizzazione target richiesto per il merge'
          }, { status: 400 });
        }

        if (orgIds.includes(target_org_id)) {
          return NextResponse.json({
            success: false,
            error: 'L\'organizzazione target non può essere inclusa nelle organizzazioni da unire'
          }, { status: 400 });
        }

        for (const orgId of orgIds) {
          try {
            // Move all members from source org to target org
            const { data: members, error: membersError } = await supabaseAdmin
              .from('org_members')
              .select('user_id, role')
              .eq('org_id', orgId);

            if (membersError) {
              results.push({ id: orgId, success: false, error: `Errore recupero membri: ${membersError.message}` });
              continue;
            }

            // Add members to target org
            for (const member of members || []) {
              const { error: addError } = await supabaseAdmin
                .from('org_members')
                .upsert({
                  org_id: target_org_id,
                  user_id: member.user_id,
                  role: member.role
                });

              if (addError) {
                console.warn(`Error adding member ${member.user_id} to target org:`, addError.message);
              }
            }

            // Remove members from source org
            const { error: removeError } = await supabaseAdmin
              .from('org_members')
              .delete()
              .eq('org_id', orgId);

            if (removeError) {
              results.push({ id: orgId, success: false, error: `Errore rimozione membri: ${removeError.message}` });
              continue;
            }

            // Delete source organization
            const { error: deleteError } = await supabaseAdmin
              .from('orgs')
              .delete()
              .eq('id', orgId);

            if (deleteError) {
              results.push({ id: orgId, success: false, error: `Errore eliminazione: ${deleteError.message}` });
            } else {
              results.push({ id: orgId, success: true });
            }
          } catch (err: any) {
            results.push({ id: orgId, success: false, error: err.message });
          }
        }
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Azione bulk non valida'
        }, { status: 400 });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Operazione completata: ${successCount} successi, ${failureCount} errori`,
      results,
      summary: {
        total: orgIds.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error: any) {
    console.error('Bulk organization action error:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}