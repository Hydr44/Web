/**
 * CORS Helper per API Backend
 * Permette chiamate da desktop app (localhost) e web app
 */

import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  'http://localhost:8080',        // Desktop app dev
  'http://localhost:8081',        // Admin panel dev
  'http://localhost:5173',        // Vite dev
  'https://rescuemanager.eu',     // Web app prod
  'https://www.rescuemanager.eu', // Web app www
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
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

