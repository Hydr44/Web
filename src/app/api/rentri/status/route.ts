import { NextRequest, NextResponse } from 'next/server';
import { rentriClient, RentriService } from '@/lib/rentri/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const service = (searchParams.get('service') as RentriService) ?? 'anagrafiche';

  try {
    const result = await rentriClient.getServiceStatus(service);
    return NextResponse.json({
      service,
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
      ok: result.ok,
      body: result.rawBody || null,
      data: result.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Errore sconosciuto',
        details: error?.response ?? null,
      },
      { status: error?.response?.status ?? 500 },
    );
  }
}


