import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Staff logout API called');
    
    // In a real implementation, you might want to invalidate the session
    // For now, we'll just return success as the client handles the logout
    
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Staff logout API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
