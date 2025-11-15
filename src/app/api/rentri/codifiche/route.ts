import { NextRequest, NextResponse } from 'next/server';

import { rentriClient } from '@/lib/rentri/client';

export async function GET(request: NextRequest) {
  const tabella = request.nextUrl.searchParams.get('tabella');
  if (!tabella) {
    return NextResponse.json(
      { error: 'Parametro "tabella" obbligatorio (es. TIPO_REGISTRO)' },
      { status: 400 },
    );
  }
  const params = Object.fromEntries(
    [...request.nextUrl.searchParams.entries()].filter(([key]) => key !== 'tabella'),
  );

  try {
    const response = await rentriClient.lookupCodifica(tabella, params);
    return NextResponse.json({
      tabella,
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      data: response.data,
      rawBody: response.rawBody,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Errore lookup codifiche RENTRI',
        response: error?.response ?? null,
      },
      { status: error?.response?.status ?? 500 },
    );
  }
}


