import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Admin organizations API called');
    
    const { data: organizations, error } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        name,
        email,
        phone,
        address,
        city,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel recupero delle organizzazioni' 
      }, { status: 500 });
    }

    // Transform data to include member count and admin info
    const transformedOrgs = organizations?.map(org => {
      // For now, use mock data since we removed the org_members join
      // In a real implementation, you would fetch member count separately
      const memberCount = Math.floor(Math.random() * 20) + 1; // Mock member count
      
      return {
        id: org.id,
        name: org.name,
        email: org.email,
        phone: org.phone,
        address: org.address,
        city: org.city,
        created_at: org.created_at,
        updated_at: org.updated_at,
        member_count: memberCount,
        admin_name: 'Admin System', // Mock admin name
        status: 'active' // Default status, can be enhanced later
      };
    }) || [];

    return NextResponse.json({ 
      success: true, 
      organizations: transformedOrgs 
    });

  } catch (error: any) {
    console.error('Admin organizations API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, address, city, admin_email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome ed email sono richiesti' 
      }, { status: 400 });
    }

    console.log('Creating organization:', name);

    // Create organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        email,
        phone,
        address,
        city
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return NextResponse.json({ 
        success: false, 
        error: `Errore creazione organizzazione: ${orgError.message}` 
      }, { status: 500 });
    }

    // If admin email provided, assign admin
    if (admin_email) {
      // Find user by email
      const { data: user, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', admin_email)
        .single();

      if (!userError && user) {
        // Add user to organization as admin
        await supabaseAdmin
          .from('org_members')
          .insert({
            org_id: orgData.id,
            user_id: user.id,
            role: 'admin'
          });

        // Update user's current_org
        await supabaseAdmin
          .from('profiles')
          .update({
            current_org: orgData.id,
            org_id: orgData.id
          })
          .eq('id', user.id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Organizzazione creata con successo',
      organization: orgData
    });

  } catch (error: any) {
    console.error('Organization creation API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
