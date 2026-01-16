import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

/**
 * Endpoint di test semplice - non chiama Supabase
 * GET /api/test/simple
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  
  return NextResponse.json({
    success: true,
    message: 'Server Next.js funziona correttamente',
    timestamp: new Date().toISOString(),
    env: {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabase_url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
        : 'non configurato',
    },
  }, {
    headers: corsHeaders(origin),
  });
}
