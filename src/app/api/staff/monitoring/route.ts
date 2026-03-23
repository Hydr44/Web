import { NextResponse } from 'next/server';

const MONITORING_URL = 'http://monitoring.rescuemanager.eu/health';
const TIMEOUT_MS = 8000;

// Mapping dei servizi ai moduli per l'admin panel
const SERVICE_MODULE_MAP: Record<string, 'sdi' | 'rentri' | 'rvfu' | 'infra' | 'leads'> = {
  'sdi-sftp-server': 'sdi',
  'rentri-api': 'rentri',
  'rentri-server': 'rentri',
  'rvfu-proxy': 'rvfu',
  'lead-api': 'leads',
  'assist-server': 'infra',
  'oauth-proxy': 'infra',
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'sdi-sftp-server': 'Server SFTP per fatturazione elettronica SDI',
  'rentri-api': 'API principale RENTRI (32 endpoint, cluster x2)',
  'rentri-server': 'Server RENTRI',
  'rvfu-proxy': 'Proxy RVFU per portale demolizioni ACI',
  'lead-api': 'API gestione lead: demo, preventivi, conversione',
  'assist-server': 'Server assistenza e richieste posizione cliente',
  'oauth-proxy': 'Proxy OAuth2 per autenticazione servizi esterni',
};

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(MONITORING_URL, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Monitoring service error: ${response.status}`);
    }

    const data = await response.json();

    // Trasforma i dati dal formato del monitoring service al formato atteso dall'admin panel
    const results = data.services.map((service: any) => ({
      name: service.name,
      module: SERVICE_MODULE_MAP[service.name] || 'infra',
      description: SERVICE_DESCRIPTIONS[service.name] || service.name,
      port: service.port,
      status: service.status,
      httpStatus: service.httpStatus,
      latency: service.latency,
      data: null,
      error: null,
      checkedAt: service.checkedAt,
    }));

    const modules = {
      sdi: results.filter((r: any) => r.module === 'sdi'),
      rentri: results.filter((r: any) => r.module === 'rentri'),
      rvfu: results.filter((r: any) => r.module === 'rvfu'),
      infra: results.filter((r: any) => r.module === 'infra'),
    };

    return NextResponse.json({
      summary: data.summary,
      modules,
      services: results,
      checkedAt: data.checkedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Fallback se il monitoring service non è raggiungibile
    return NextResponse.json({
      summary: {
        total: 0,
        online: 0,
        offline: 0,
        degraded: 0,
      },
      modules: {
        sdi: [],
        rentri: [],
        rvfu: [],
        infra: [],
      },
      services: [],
      checkedAt: new Date().toISOString(),
      error: `Monitoring service non raggiungibile: ${message}`,
    });
  }
}
