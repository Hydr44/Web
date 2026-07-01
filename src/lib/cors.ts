/**
 * CORS Helper per API Backend
 * Permette chiamate da desktop app (localhost) e web app
 */

import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  'http://localhost:8080',        // Desktop app dev
  'http://localhost:8081',        // Admin panel dev (legacy)
  'http://localhost:5173',        // Vite dev
  'http://localhost:5175',        // Admin panel Electron dev (selettore ambienti)
  'https://rescuemanager.eu',     // Web app prod
  'https://www.rescuemanager.eu', // Web app www
  'https://staging.rescuemanager.eu', // Staging
  'app://.',                      // Electron app (file://)
  'capacitor://localhost'         // Mobile app
];

export function corsHeaders(origin?: string | null) {
  const isDev = process.env.NODE_ENV === 'development';
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    (isDev && origin.startsWith('http://localhost:')) ||
    (isDev && origin.startsWith('http://127.0.0.1:')) ||
    origin.startsWith('app://')
  );

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * True se l'origin è nella allowlist (siti + app desktop `app://` + mobile
 * capacitor + localhost in dev). Usare per NON riflettere origin arbitrari con
 * `Allow-Credentials: true` (che permetterebbe a un sito esterno di leggere
 * risposte con la sessione della vittima).
 */
export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return false;
  const isDev = process.env.NODE_ENV === 'development';
  return (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith('app://') ||
    (isDev && origin.startsWith('http://localhost:')) ||
    (isDev && origin.startsWith('http://127.0.0.1:'))
  );
}

export function handleCors(request: Request) {
  const origin = request.headers.get('origin');

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin)
    });
  }

  return corsHeaders(origin);
}

