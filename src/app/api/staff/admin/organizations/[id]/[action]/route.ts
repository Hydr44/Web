import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id: orgId, action } = await params;

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
            created_by,
            is_active
          `)
          .eq('id', orgId)
          .single();

        if (error || !org) {
          return NextResponse.json({
            success: false,
            error: 'Organizzazione non trovata'
          }, { status: 404 });
        }

        const { count: memberCount } = await supabaseAdmin
          .from('org_members')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId);

        // 1) Abbonamento da org_subscriptions
        let subscription: { plan: string; status: string; current_period_end: string | null } | null = null;
        const { data: orgSub } = await supabaseAdmin
          .from('org_subscriptions')
          .select('plan, status, current_period_end')
          .eq('org_id', orgId)
          .maybeSingle();
        if (orgSub) {
          subscription = orgSub;
        } else {
          // 2) Fallback: subscription da tabella user-based (owner dell'org)
          const { data: owner } = await supabaseAdmin
            .from('org_members')
            .select('user_id')
            .eq('org_id', orgId)
            .eq('role', 'owner')
            .limit(1)
            .maybeSingle();
          if (owner?.user_id) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('stripe_customer_id, current_plan')
              .eq('id', owner.user_id)
              .single();
            if (profile?.stripe_customer_id || profile?.current_plan) {
              let userSub: { status: string; current_period_end: string | null } | null = null;
              const { data: subByUser } = await supabaseAdmin
                .from('subscriptions')
                .select('status, current_period_end')
                .eq('user_id', owner.user_id)
                .in('status', ['active', 'trialing'])
                .limit(1)
                .maybeSingle();
              if (subByUser) userSub = subByUser;
              else if (profile.stripe_customer_id) {
                const { data: subByCust } = await supabaseAdmin
                  .from('subscriptions')
                  .select('status, current_period_end')
                  .eq('stripe_customer_id', profile.stripe_customer_id)
                  .in('status', ['active', 'trialing'])
                  .limit(1)
                  .maybeSingle();
                if (subByCust) userSub = subByCust;
              }
              if (userSub && (profile.current_plan || userSub.status)) {
                subscription = {
                  plan: profile.current_plan || '—',
                  status: userSub.status,
                  current_period_end: userSub.current_period_end
                };
              } else if (profile.current_plan) {
                subscription = {
                  plan: profile.current_plan,
                  status: 'active',
                  current_period_end: null
                };
              }
            }
          }
        }

        // 3) company_code da company_settings
        const { data: settings } = await supabaseAdmin
          .from('company_settings')
          .select('company_code')
          .eq('org_id', orgId)
          .maybeSingle();

        responseData = { 
          success: true, 
          organization: {
            ...org,
            member_count: memberCount || 0,
            status: (org as any).is_active !== false ? 'active' : 'inactive',
            subscription,
            company_code: settings?.company_code || null
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
        const { data, error } = await supabaseAdmin
          .from('orgs')
          .update({
            is_active: false,
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
            is_active: true,
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
        // Usa funzione SQL che fa cascade su tutte le tabelle collegate (FK senza ON DELETE CASCADE)
        const { error: cascadeError } = await supabaseAdmin.rpc('delete_org_cascade', {
          p_org_id: orgId,
        });

        if (cascadeError) {
          return NextResponse.json({
            success: false,
            error: `Impossibile eliminare: ci sono dati collegati. Esegui la migrazione 20260216_delete_org_cascade.sql su Supabase, poi riprova. (${cascadeError.message})`,
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Organizzazione eliminata con successo' };
        break;
      }

      case 'members': {
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
        const { count: memberCount } = await supabaseAdmin
          .from('org_members')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId);

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
