// Documenti di un lead (F5) — per la pagina Revisione admin: elenca i documenti
// (visura) con un URL di download firmato a breve scadenza. Solo staff.
// CORS + auth gestiti dal middleware su /api/staff/admin/*.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { getSignedDownloadUrl } from '@/lib/r2-storage';
import { createAuditLog } from '@/lib/staff-audit';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('lead_documents')
    .select('id, document_type, file_name, storage_path, file_size_bytes, mime_type, uploaded_at, notes')
    .eq('lead_id', params.id)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Firma un URL di download per ciascun documento (5 min, forza il nome file).
  const documents = await Promise.all((data || []).map(async (d) => {
    let download_url: string | null = null;
    try {
      if (d.storage_path) download_url = await getSignedDownloadUrl(d.storage_path, 300, d.file_name || undefined);
    } catch { /* doc senza file accessibile */ }
    return {
      id: d.id, document_type: d.document_type, file_name: d.file_name,
      file_size_bytes: d.file_size_bytes, mime_type: d.mime_type,
      uploaded_at: d.uploaded_at, notes: d.notes, download_url,
    };
  }));

  // Audit: accesso a documenti sensibili (visura = PII).
  if (documents.length > 0) {
    try {
      await createAuditLog(
        staff.sub, staff.full_name, staff.role,
        'system.export', 'lead_documents', params.id, `lead ${params.id}`,
        { count: documents.length }, request, true,
      );
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ success: true, documents });
}
