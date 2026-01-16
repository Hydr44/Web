import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Endpoint di test per verificare la connessione a Supabase
 * GET /api/test/supabase
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const overallStartTime = Date.now();
  
  const results: any = {
    timestamp: new Date().toISOString(),
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'presente' : 'mancante',
    service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'presente' : 'mancante',
    tests: [],
    note: '⚠️ Se questo endpoint si blocca, il problema è probabilmente: 1) Progetto Supabase in pausa 2) Problemi di rete/VPS 3) Effetti residui dalla manutenzione del 16/01/2026',
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

  // Test 2: Connessione base (ping) con timeout
  let test2StartTime = Date.now();
  try {
    const queryPromise = supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout dopo 5 secondi')), 5000)
    );
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
    
    const elapsed = Date.now() - test2StartTime;
    results.tests.push({
      name: 'Database Connection',
      success: !error,
      elapsed: `${elapsed}ms`,
      error: error?.message,
    });
  } catch (err: any) {
    const elapsed = Date.now() - test2StartTime;
    results.tests.push({
      name: 'Database Connection',
      success: false,
      elapsed: `${elapsed}ms`,
      error: err.message,
      note: err.message.includes('Timeout') 
        ? '⚠️ Database non raggiungibile - progetto potrebbe essere in pausa'
        : undefined,
    });
  }

  // Test 3: Auth Admin API (con timeout più corto)
  let test3StartTime = Date.now();
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout dopo 5 secondi')), 5000)
    );
    
    const listUsersPromise = supabaseAdmin.auth.admin.listUsers();
    const result = await Promise.race([listUsersPromise, timeoutPromise]) as any;
    
    const elapsed = Date.now() - test3StartTime;
    results.tests.push({
      name: 'Auth Admin API (listUsers)',
      success: true,
      elapsed: `${elapsed}ms`,
      users_count: result?.data?.users?.length || 0,
    });
  } catch (err: any) {
    const elapsed = Date.now() - test3StartTime;
    results.tests.push({
      name: 'Auth Admin API (listUsers)',
      success: false,
      elapsed: `${elapsed}ms`,
      error: err.message,
      note: err.message.includes('Timeout') 
        ? '⚠️ CRITICO: Supabase non risponde. Il progetto potrebbe essere in pausa. Vai su https://supabase.com/dashboard e verifica.'
        : undefined,
    });
  }

  // Test 4: Health check diretto con timeout
  let test4StartTime = Date.now();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const elapsed = Date.now() - test4StartTime;
    
    results.tests.push({
      name: 'Direct HTTP Health Check',
      success: response.ok,
      status: response.status,
      elapsed: `${elapsed}ms`,
    });
  } catch (err: any) {
    const elapsed = Date.now() - test4StartTime;
    results.tests.push({
      name: 'Direct HTTP Health Check',
      success: false,
      elapsed: `${elapsed}ms`,
      error: err.message,
      note: err.name === 'AbortError' 
        ? '⚠️ Timeout: Supabase non risponde alle richieste HTTP'
        : undefined,
    });
  }

  const allTestsPassed = results.tests.every((t: any) => t.success);
  const totalElapsed = Date.now() - overallStartTime;
  
  return NextResponse.json({
    success: allTestsPassed,
    message: allTestsPassed 
      ? 'Tutti i test Supabase sono passati'
      : 'Alcuni test Supabase sono falliti',
    total_elapsed: `${totalElapsed}ms`,
    results,
    note: !allTestsPassed 
      ? '⚠️ Se i test falliscono con timeout, verifica: 1) Progetto Supabase in pausa? 2) Problemi di rete/VPS? 3) Status: https://status.supabase.com'
      : undefined,
  }, {
    headers: corsHeaders(origin),
  });
}
