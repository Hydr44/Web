import { NextResponse } from 'next/server';

const VPS_IP = '217.154.118.37';
const TIMEOUT_MS = 8000;

interface ServiceCheck {
  name: string;
  module: 'sdi' | 'rentri' | 'rvfu' | 'infra' | 'leads';
  url: string;
  description: string;
  port: number;
}

const SERVICES: ServiceCheck[] = [
  // ─── SDI ───
  {
    name: 'sdi-sftp-server',
    module: 'sdi',
    url: `http://${VPS_IP}:3005/health`,
    port: 3005,
    description: 'Server SFTP per fatturazione elettronica SDI'
  },
  // ─── RENTRI ───
  {
    name: 'rentri-api',
    module: 'rentri',
    url: `http://${VPS_IP}:3003/health`,
    port: 3003,
    description: 'API principale RENTRI (32 endpoint, cluster x2)'
  },
  {
    name: 'rentri-server',
    module: 'rentri',
    url: `http://${VPS_IP}:3200/health`,
    port: 3200,
    description: 'Server RENTRI'
  },
  // ─── RVFU ───
  {
    name: 'rvfu-proxy-direct',
    module: 'rvfu',
    url: `http://${VPS_IP}:3009/health`,
    port: 3009,
    description: 'Proxy RVFU per portale demolizioni ACI'
  },
  // ─── LEADS ───
  {
    name: 'lead-api',
    module: 'leads',
    url: `http://${VPS_IP}:3006/health`,
    port: 3006,
    description: 'API gestione lead: demo, preventivi, conversione'
  },
  // ─── INFRA ───
  {
    name: 'assist-server',
    module: 'infra',
    url: `http://${VPS_IP}:3100/health`,
    port: 3100,
    description: 'Server assistenza e richieste posizione cliente'
  },
  {
    name: 'oauth-proxy',
    module: 'infra',
    url: `http://${VPS_IP}:3008/health`,
    port: 3008,
    description: 'Proxy OAuth2 per autenticazione servizi esterni'
  },
  {
    name: 'ebay-oauth',
    module: 'infra',
    url: `http://${VPS_IP}:3007/health`,
    port: 3007,
    description: 'OAuth eBay'
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
