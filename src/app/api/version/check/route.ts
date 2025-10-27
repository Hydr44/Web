import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * GET /api/version/check?current=X.Y.Z
 * Verifica se l'app deve essere aggiornata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('current') || '0.0.0';

    // Get app version requirements
    const { data: versionInfo, error } = await supabaseAdmin
      .from('app_versions')
      .select('version, min_required, force_update, notes, download_url')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !versionInfo) {
      return NextResponse.json({
        update_required: false,
        force_update: false,
        current_version: currentVersion,
        min_required: currentVersion,
        latest_version: currentVersion
      });
    }

    // Simple version compare
    const isUpdateRequired = compareVersions(currentVersion, versionInfo.min_required) < 0;

    return NextResponse.json({
      update_required: isUpdateRequired,
      force_update: versionInfo.force_update,
      current_version: currentVersion,
      min_required: versionInfo.min_required,
      latest_version: versionInfo.version,
      notes: versionInfo.notes,
      download_url: versionInfo.download_url
    });

  } catch (error) {
    console.error('Version check error:', error);
    return NextResponse.json(
      { update_required: false, force_update: false },
      { status: 200 }
    );
  }
}

/**
 * Compare two version strings
 * Returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

