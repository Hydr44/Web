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
 * POST /api/rvfu/auth/authorize
 * Proxy per endpoint SSO /oauth2/authorize
 * Body: { tokenId, clientId, redirectUri, environment?: 'formation' | 'production' }
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  try {
    const { tokenId, clientId, redirectUri, environment = "formation" } = await request.json();

    if (!tokenId || !clientId || !redirectUri) {
      return new NextResponse(
        JSON.stringify({ error: "tokenId, clientId e redirectUri sono richiesti" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = environment === "formation" ? SSO_BASE_URL_FORMATION : SSO_BASE_URL_PRODUCTION;

    // Prepara FormData come da specifiche
    const formData = new URLSearchParams();
    formData.append("scope", "openid profile");
    formData.append("response_type", "code");
    formData.append("client_id", clientId);
    formData.append("csrf", tokenId);
    formData.append("redirect_uri", redirectUri);
    formData.append("state", "abc123");
    formData.append("nonce", "123abc");
    formData.append("decision", "allow");

    // Chiamata all'endpoint SSO
    const response = await fetch(`${baseUrl}/oauth2/authorize`, {
      method: "POST",
      headers: {
        "Cookie": `iPlanetDirectoryPro=${tokenId}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      redirect: "manual",
    });

    const location = response.headers.get("Location");
    
    if (!location) {
      const responseText = await response.text();
      return new NextResponse(
        JSON.stringify({ error: "No authorization code received", details: responseText }),
        { status: response.status, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Estrae il code dall'URL di redirect
    try {
      const url = new URL(location);
      const code = url.searchParams.get("code");
      
      if (!code) {
        return new NextResponse(
          JSON.stringify({ error: "Authorization code not found in redirect URL", location }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      return new NextResponse(
        JSON.stringify({ code, location }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    } catch (urlError) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid redirect URL", location }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("RVFU authorize error:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
}

