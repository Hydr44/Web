import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Endpoint di test per verificare la connessione a Supabase
 * GET /api/test/supabase
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const results: any = {
    timestamp: new Date().toISOString(),
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'presente' : 'mancante',
    service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'presente' : 'mancante',
    tests: [],
  };

  // Test 1: Verifica configurazione
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      success: false,
      error: 'Configurazione Supabase incompleta',
      results,
    }, {
      status: 500,
      headers: corsHeaders(origin),
    });
  }

  // Test 2: Connessione base (ping)
  try {
    const startTime = Date.now();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    const elapsed = Date.now() - startTime;
    results.tests.push({
      name: 'Database Connection',
      success: !error,
      elapsed: `${elapsed}ms`,
      error: error?.message,
    });
  } catch (err: any) {
    results.tests.push({
      name: 'Database Connection',
      success: false,
      error: err.message,
    });
  }

  // Test 3: Auth Admin API
  try {
    const startTime = Date.now();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    const listUsersPromise = supabaseAdmin.auth.admin.listUsers();
    const result = await Promise.race([listUsersPromise, timeoutPromise]) as any;
    
    const elapsed = Date.now() - startTime;
    results.tests.push({
      name: 'Auth Admin API (listUsers)',
      success: true,
      elapsed: `${elapsed}ms`,
      users_count: result?.data?.users?.length || 0,
    });
  } catch (err: any) {
    results.tests.push({
      name: 'Auth Admin API (listUsers)',
      success: false,
      error: err.message,
      note: err.message.includes('Timeout') 
        ? 'Supabase potrebbe essere in pausa o non raggiungibile'
        : undefined,
    });
  }

  // Test 4: Health check diretto
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    
    const startTime = Date.now();
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const elapsed = Date.now() - startTime;
    
    results.tests.push({
      name: 'Direct HTTP Health Check',
      success: response.ok,
      status: response.status,
      elapsed: `${elapsed}ms`,
    });
  } catch (err: any) {
    results.tests.push({
      name: 'Direct HTTP Health Check',
      success: false,
      error: err.message,
    });
  }

  const allTestsPassed = results.tests.every((t: any) => t.success);
  
  return NextResponse.json({
    success: allTestsPassed,
    message: allTestsPassed 
      ? 'Tutti i test Supabase sono passati'
      : 'Alcuni test Supabase sono falliti',
    results,
  }, {
    headers: corsHeaders(origin),
  });
}
