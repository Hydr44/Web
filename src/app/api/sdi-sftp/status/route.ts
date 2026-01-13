import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * GET /api/sdi-sftp/status
 * Recupera lo status SDI-SFTP dal VPS tramite SSH
 */
export async function GET(request: NextRequest) {
  try {
    // Usa SSH per eseguire curl sul VPS
    const command = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 vps-sdi "curl -s http://localhost:3004/api/sdi-sftp/status"`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000,
      maxBuffer: 1024 * 1024, // 1MB
    });

    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.error('[SDI-SFTP-STATUS] SSH stderr:', stderr);
    }

    try {
      const data = JSON.parse(stdout);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('[SDI-SFTP-STATUS] Errore parsing JSON:', parseError);
      console.error('[SDI-SFTP-STATUS] Output:', stdout);
      return NextResponse.json(
        { 
          error: 'Errore parsing risposta VPS', 
          details: stdout.substring(0, 200)
        },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('[SDI-SFTP-STATUS] Errore:', error);
    return NextResponse.json(
      { 
        error: 'Errore connessione al VPS', 
        details: error.message,
        test_mode: true,
        timestamp: new Date().toISOString(),
        files_pending: [],
        files_eo: [],
        summary: { pending_count: 0, eo_count: 0 }
      },
      { status: 503 }
    );
  }
}
