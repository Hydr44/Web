import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Admin sessions API called');
    
    // Mock session data for now - in a real implementation, you would track sessions
    const mockSessions = [
      {
        id: 'session_1',
        user_id: 'user_1',
        user_name: 'Admin User',
        user_role: 'admin',
        session_token: 'token_123',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'Windows 10',
        location: 'Milano, Italia',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        last_activity: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      },
      {
        id: 'session_2',
        user_id: 'user_2',
        user_name: 'Marketing User',
        user_role: 'marketing',
        session_token: 'token_456',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        device_type: 'mobile',
        browser: 'Safari',
        os: 'iOS 15',
        location: 'Roma, Italia',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        last_activity: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        is_active: true,
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now
      },
      {
        id: 'session_3',
        user_id: 'user_3',
        user_name: 'Support User',
        user_role: 'support',
        session_token: 'token_789',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        device_type: 'desktop',
        browser: 'Firefox',
        os: 'macOS',
        location: 'Torino, Italia',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        is_active: false,
        expires_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago (expired)
      }
    ];

    return NextResponse.json({ 
      success: true, 
      sessions: mockSessions 
    });

  } catch (error: any) {
    console.error('Admin sessions API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
