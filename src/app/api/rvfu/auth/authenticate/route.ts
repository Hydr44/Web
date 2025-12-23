import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

const SSO_BASE_URL_FORMATION = "https://ssoformazione.ilportaledeltrasporto.it/sso";
const SSO_BASE_URL_PRODUCTION = "https://sso.ilportaledeltrasporto.it/sso";

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  return new NextResponse(null, { status: 204, headers });
}

/**
 * POST /api/rvfu/auth/authenticate
 * Proxy per endpoint SSO /json/authenticate
 * Body: { username, password, environment?: 'formation' | 'production' }
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  try {
    const { username, password, environment = "formation" } = await request.json();

    if (!username || !password) {
      return new NextResponse(
        JSON.stringify({ error: "Username e password sono richiesti" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = environment === "formation" ? SSO_BASE_URL_FORMATION : SSO_BASE_URL_PRODUCTION;

    // Chiamata all'endpoint SSO
    const response = await fetch(`${baseUrl}/json/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OpenAM-Username": username,
        "X-OpenAM-Password": password,
        "Accept-API-Version": "resource=2.0, protocol=1.0",
      },
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { error: responseText };
    }

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({
          error: responseData.message || responseData.reason || "Authentication failed",
          code: responseData.code || response.status,
        }),
        { status: response.status, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Restituisce il tokenId dalla risposta
    return new NextResponse(
      JSON.stringify(responseData),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("RVFU authenticate error:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
}

