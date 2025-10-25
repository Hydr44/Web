import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST OAUTH ENDPOINT ===');
    
    const supabase = await supabaseServer();
    console.log('Supabase connected');
    
    // Test 1: Verifica se la tabella esiste
    console.log('Testing oauth_codes table...');
    const { data: testData, error: testError } = await supabase
      .from('oauth_codes')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Table test failed:', testError);
      return NextResponse.json({
        error: 'Table test failed',
        details: testError.message,
        code: testError.code,
        hint: testError.hint
      }, { status: 500 });
    }
    
    console.log('Table test passed, found', testData?.length || 0, 'records');
    
    // Test 2: Prova a inserire un record di test
    console.log('Testing insert...');
    const testRecord = {
      code: `test_${Date.now()}`,
      user_id: null,
      app_id: 'test_app',
      redirect_uri: 'test://callback',
      state: 'test_state',
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      used: false
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('oauth_codes')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert test failed:', insertError);
      return NextResponse.json({
        error: 'Insert test failed',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 });
    }
    
    console.log('Insert test passed, created record:', insertData.id);
    
    // Test 3: Pulisci il record di test
    await supabase
      .from('oauth_codes')
      .delete()
      .eq('id', insertData.id);
    
    console.log('Cleanup completed');
    
    return NextResponse.json({
      success: true,
      message: 'All OAuth tests passed',
      table_exists: true,
      insert_works: true,
      cleanup_completed: true
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
