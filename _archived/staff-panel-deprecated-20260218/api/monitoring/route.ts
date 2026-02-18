import { NextResponse } from 'next/server';

const VPS_IP = '217.154.118.37';
const TIMEOUT_MS = 8000;

interface ServiceCheck {
  name: string;
  module: 'sdi' | 'rentri' | 'rvfu' | 'infra';
  url: string;
  description: string;
  port: number;
}

const SERVICES: ServiceCheck[] = [
  // ─── SDI ───
  {
    name: 'sdi-sftp-server',
    module: 'sdi',
    url: 'http://sdi-sftp.rescuemanager.eu/health',
    port: 3004,
    description: 'Server SFTP per fatturazione elettronica SDI'
  },
  {
    name: 'sdi-sftp-status',
    module: 'sdi',
    url: 'http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/status',
    port: 3004,
    description: 'Stato canale SFTP SDI (file pending, esiti EO)'
  },
  // ─── RENTRI ───
  {
    name: 'rentri-api',
    module: 'rentri',
    url: 'https://rentri-test.rescuemanager.eu/api/rentri/status',
    port: 3003,
    description: 'API principale RENTRI (32 endpoint, cluster x2)'
  },
  {
    name: 'rentri-polling',
    module: 'rentri',
    url: `http://${VPS_IP}:3001/health`,
    port: 3001,
    description: 'Polling transazioni RENTRI'
  },
  {
    name: 'rentri-cert-upload',
    module: 'rentri',
    url: `http://${VPS_IP}:3456/health`,
    port: 3456,
    description: 'Upload certificati .p12 RENTRI'
  },
  // ─── RVFU ───
  {
    name: 'rvfu-proxy',
    module: 'rvfu',
    url: 'https://rvfu.rescuemanager.eu/health',
    port: 3002,
    description: 'Proxy RVFU per portale demolizioni ACI'
  },
  // ─── INFRA ───
  {
    name: 'oauth-proxy',
    module: 'infra',
    url: 'https://oauth.rescuemanager.eu/health',
    port: 3005,
    description: 'Proxy OAuth2 per autenticazione servizi esterni'
  },
];

async function checkService(service: ServiceCheck) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(service.url, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    let data = null;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    return {
      name: service.name,
      module: service.module,
      description: service.description,
      port: service.port,
      status: response.ok ? 'online' : 'degraded',
      httpStatus: response.status,
      latency,
      data,
      error: null,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const latency = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = message.includes('abort');

    return {
      name: service.name,
      module: service.module,
      description: service.description,
      port: service.port,
      status: isTimeout ? 'timeout' : 'offline',
      httpStatus: null,
      latency,
      data: null,
      error: isTimeout ? `Timeout dopo ${TIMEOUT_MS}ms` : message,
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function GET() {
  const results = await Promise.all(SERVICES.map(checkService));

  const modules = {
    sdi: results.filter(r => r.module === 'sdi'),
    rentri: results.filter(r => r.module === 'rentri'),
    rvfu: results.filter(r => r.module === 'rvfu'),
    infra: results.filter(r => r.module === 'infra'),
  };

  const summary = {
    total: results.length,
    online: results.filter(r => r.status === 'online').length,
    offline: results.filter(r => r.status === 'offline').length,
    degraded: results.filter(r => r.status === 'degraded' || r.status === 'timeout').length,
  };

  return NextResponse.json({
    summary,
    modules,
    services: results,
    checkedAt: new Date().toISOString(),
  });
}
