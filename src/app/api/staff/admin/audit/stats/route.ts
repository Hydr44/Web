import { NextResponse } from 'next/server';
import { AuditLogger } from '@/lib/staff-audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '7d';
    
    console.log('Audit stats API called with dateRange:', dateRange);
    
    const auditLogger = AuditLogger.getInstance();
    
    // Calculate date range
    const endDate = new Date().toISOString();
    const startDate = new Date();
    
    switch (dateRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const stats = await auditLogger.getLogStats(
      startDate.toISOString(),
      endDate
    );

    return NextResponse.json({ 
      success: true, 
      stats 
    });

  } catch (error: any) {
    console.error('Audit stats API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
