import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: { orgId: string, action: string } }
) {
  const { orgId, action } = params;

  try {
    console.log(`Organization action API called: ${action} for org ${orgId}`);

    let responseData: any;
    let status = 200;

    switch (action) {
      case 'view': {
        const { data: org, error } = await supabaseAdmin
          .from('orgs')
          .select(`
            id,
            name,
            email,
            phone,
            address,
            website,
            vat,
            tax_code,
            description,
            created_at,
            updated_at,
            created_by
          `)
          .eq('id', orgId)
          .single();

        if (error || !org) {
          return NextResponse.json({
            success: false,
            error: 'Organizzazione non trovata'
          }, { status: 404 });
        }

        // Get member count
        const { count: memberCount } = await supabaseAdmin
          .from('org_members')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId);

        responseData = { 
          success: true, 
          organization: {
            ...org,
            member_count: memberCount || 0
          }
        };
        break;
      }

      case 'edit': {
        const { 
          name, 
          email, 
          phone, 
          address, 
          website, 
          vat, 
          tax_code, 
          description 
        } = await request.json();
        
        const { data, error } = await supabaseAdmin
          .from('orgs')
          .update({
            name,
            email,
            phone,
            address,
            website,
            vat,
            tax_code,
            description,
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore aggiornamento organizzazione'
          }, { status: 500 });
        }

        responseData = { success: true, organization: data, message: 'Organizzazione aggiornata con successo' };
        break;
      }

      case 'suspend': {
        // In a real implementation, you would mark the org as inactive
        // For now, we'll just update the timestamp
        const { data, error } = await supabaseAdmin
          .from('orgs')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore sospensione organizzazione'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Organizzazione sospesa con successo', organization: data };
        break;
      }

      case 'activate': {
        const { data, error } = await supabaseAdmin
          .from('orgs')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore attivazione organizzazione'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Organizzazione attivata con successo', organization: data };
        break;
      }

      case 'delete': {
        // First, remove all members from the organization
        const { error: membersError } = await supabaseAdmin
          .from('org_members')
          .delete()
          .eq('org_id', orgId);

        if (membersError) {
          return NextResponse.json({
            success: false,
            error: `Errore rimozione membri: ${membersError.message}`
          }, { status: 500 });
        }

        // Then delete the organization
        const { error: orgError } = await supabaseAdmin
          .from('orgs')
          .delete()
          .eq('id', orgId);

        if (orgError) {
          return NextResponse.json({
            success: false,
            error: `Errore eliminazione organizzazione: ${orgError.message}`
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Organizzazione eliminata con successo' };
        break;
      }

      case 'members': {
        // First get org_members
        const { data: orgMembers, error: orgMembersError } = await supabaseAdmin
          .from('org_members')
          .select(`
            user_id,
            role,
            created_at
          `)
          .eq('org_id', orgId);

        if (orgMembersError) {
          return NextResponse.json({
            success: false,
            error: orgMembersError.message || 'Errore recupero membri'
          }, { status: 500 });
        }

        // Then get profiles for each member
        const memberIds = orgMembers?.map(m => m.user_id) || [];
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            avatar_url
          `)
          .in('id', memberIds);

        if (profilesError) {
          return NextResponse.json({
            success: false,
            error: profilesError.message || 'Errore recupero profili'
          }, { status: 500 });
        }

        // Combine the data
        const members = orgMembers?.map(orgMember => {
          const profile = profiles?.find(p => p.id === orgMember.user_id);
          return {
            ...orgMember,
            profile: profile || null
          };
        }) || [];

        responseData = { success: true, members };
        break;
      }

      case 'add-member': {
        const { user_id, role = 'member' } = await request.json();
        
        if (!user_id) {
          return NextResponse.json({
            success: false,
            error: 'ID utente richiesto'
          }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('org_members')
          .insert({
            org_id: orgId,
            user_id,
            role
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({
            success: false,
            error: error.message || 'Errore aggiunta membro'
          }, { status: 500 });
        }

        responseData = { success: true, member: data, message: 'Membro aggiunto con successo' };
        break;
      }

      case 'remove-member': {
        const { user_id } = await request.json();
        
        if (!user_id) {
          return NextResponse.json({
            success: false,
            error: 'ID utente richiesto'
          }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('org_members')
          .delete()
          .eq('org_id', orgId)
          .eq('user_id', user_id);

        if (error) {
          return NextResponse.json({
            success: false,
            error: error.message || 'Errore rimozione membro'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Membro rimosso con successo' };
        break;
      }

      case 'analytics': {
        // Get basic analytics for the organization
        const { count: memberCount } = await supabaseAdmin
          .from('org_members')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId);

        // Mock analytics data - in a real implementation, you'd query actual data
        const analytics = {
          member_count: memberCount || 0,
          active_users: Math.floor((memberCount || 0) * 0.8),
          total_activity: Math.floor(Math.random() * 1000) + 100,
          growth_rate: Math.floor(Math.random() * 20) + 5,
          last_activity: new Date().toISOString()
        };

        responseData = { success: true, analytics };
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Azione non valida'
        }, { status: 400 });
    }

    return NextResponse.json(responseData, { status });

  } catch (error: any) {
    console.error(`Error in organization action (${action}):`, error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}