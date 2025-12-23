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
 * POST /api/rvfu/auth/token
 * Proxy per endpoint SSO /oauth2/access_token
 * Body: { code, clientId, clientSecret, redirectUri, environment?: 'formation' | 'production' }
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  try {
    const { code, clientId, clientSecret, redirectUri, environment = "formation" } = await request.json();

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return new NextResponse(
        JSON.stringify({ error: "code, clientId, clientSecret e redirectUri sono richiesti" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = environment === "formation" ? SSO_BASE_URL_FORMATION : SSO_BASE_URL_PRODUCTION;

    // Prepara FormData come da specifiche (client_secret_post)
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", redirectUri);
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
          error: responseData.error || responseData.error_description || "Token exchange failed",
        }),
        { status: response.status, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Restituisce i token (id_token, access_token, refresh_token)
    return new NextResponse(
      JSON.stringify(responseData),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("RVFU token exchange error:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
}

