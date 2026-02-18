import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Staff analytics API called');
    
    // Load all data in parallel
    const [
      leadsResult,
      orgsResult,
      profilesResult,
      transportsResult,
      vehiclesResult,
      driversResult
    ] = await Promise.all([
      supabaseAdmin.from('leads').select('*'),
      supabaseAdmin.from('orgs').select('id'),
      supabaseAdmin.from('profiles').select('id'),
      supabaseAdmin.from('transports').select('id'),
      supabaseAdmin.from('vehicles').select('id'),
      supabaseAdmin.from('drivers').select('id')
    ]);

    const leads = leadsResult.data || [];
    const orgs = orgsResult.data || [];
    const profiles = profilesResult.data || [];
    const transports = transportsResult.data || [];
    const vehicles = vehiclesResult.data || [];
    const drivers = driversResult.data || [];

    return NextResponse.json({ 
      success: true, 
      data: {
        leads,
        orgs,
        profiles,
        transports,
        vehicles,
        drivers
      }
    });

  } catch (error: any) {
    console.error('Staff analytics API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
