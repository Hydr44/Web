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
 * POST /api/rvfu/auth/refresh
 * Proxy per refresh token endpoint SSO /oauth2/access_token
 * Body: { refreshToken, clientId, clientSecret, environment?: 'formation' | 'production' }
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  try {
    const { refreshToken, clientId, clientSecret, environment = "formation" } = await request.json();

    if (!refreshToken || !clientId || !clientSecret) {
      return new NextResponse(
        JSON.stringify({ error: "refreshToken, clientId e clientSecret sono richiesti" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = environment === "formation" ? SSO_BASE_URL_FORMATION : SSO_BASE_URL_PRODUCTION;

    // Prepara FormData per refresh token
    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);

    // Chiamata all'endpoint SSO
    const response = await fetch(`${baseUrl}/oauth2/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
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
          error: responseData.error || responseData.error_description || "Token refresh failed",
        }),
        { status: response.status, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Restituisce i nuovi token
    return new NextResponse(
      JSON.stringify(responseData),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("RVFU refresh token error:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
}

