import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function checkDatabaseHealth() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error } = await supabase.from('orgs').select('count').limit(1).single();
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      latency: 0,
      error: error?.message
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkRedisHealth() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return { status: 'not_configured', latency: 0 };
    }
    
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });
    
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'unknown';
  const startTime = Date.now();
  
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth()
  ]);
  
  const responseTime = Date.now() - startTime;
  
  const isHealthy = dbHealth.status === 'healthy' && 
                    (redisHealth.status === 'healthy' || redisHealth.status === 'not_configured');
  
  const response = {
    status: isHealthy ? 'ok' : 'degraded',
    environment: env,
    timestamp: new Date().toISOString(),
    responseTime,
    services: {
      database: dbHealth,
      redis: redisHealth
    },
    version: process.env.npm_package_version || '0.1.0'
  };
  
  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
