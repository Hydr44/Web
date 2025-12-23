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

    console.log('[RVFU Proxy] Chiamata SSO authorize:', {
      baseUrl: `${baseUrl}/oauth2/authorize`,
      clientId,
      redirectUri,
      environment,
      tokenIdLength: tokenId?.length,
      formData: Object.fromEntries(formData),
    });

    // Chiamata all'endpoint SSO
    let response: Response;
    let responseText: string;
    
    try {
      response = await fetch(`${baseUrl}/oauth2/authorize`, {
        method: "POST",
        headers: {
          "Cookie": `iPlanetDirectoryPro=${tokenId}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        redirect: "manual",
      });

      responseText = await response.text();
      
      console.log('[RVFU Proxy] Risposta SSO authorize:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("Content-Type"),
        hasLocation: !!response.headers.get("Location"),
        location: response.headers.get("Location"),
        bodyPreview: responseText.substring(0, 2000),
      });

      // Estrai errori dall'HTML se presente
      if (responseText.includes('<!DOCTYPE html>')) {
        const pageDataMatch = responseText.match(/pageData\s*=\s*({[\s\S]*?})\s*<\/script>/i);
        if (pageDataMatch) {
          try {
            const pageData = eval(`(${pageDataMatch[1]})`);
            if (pageData.error) {
              console.error('[RVFU Proxy] Errore OAuth2:', {
                message: pageData.error.message,
                description: pageData.error.description,
              });
            }
          } catch (e) {
            // Estrai manualmente
            const descMatch = responseText.match(/description:\s*"([^"]+)"/i);
            const msgMatch = responseText.match(/message:\s*"([^"]+)"/i);
            if (descMatch || msgMatch) {
              console.error('[RVFU Proxy] Errore OAuth2 (parsed):', {
                message: msgMatch?.[1],
                description: descMatch?.[1],
              });
            }
          }
        }
      }

    } catch (fetchError: any) {
      console.error('[RVFU Proxy] Errore fetch SSO:', {
        error: fetchError.message,
        cause: fetchError.cause,
        code: fetchError.code,
      });
      return new NextResponse(
        JSON.stringify({ 
          error: "Errore durante la chiamata SSO", 
          details: fetchError.message,
          code: fetchError.code,
          cause: fetchError.cause?.message,
        }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const location = response.headers.get("Location");
    
    if (!location) {
      // Estrai dettagli errore se presente
      let errorDetails: any = { raw: responseText.substring(0, 500) };
      
      if (responseText.includes('<!DOCTYPE html>')) {
        const pageDataMatch = responseText.match(/pageData\s*=\s*({[\s\S]*?})\s*<\/script>/i);
        if (pageDataMatch) {
          try {
            const pageData = eval(`(${pageDataMatch[1]})`);
            errorDetails = {
              oauthError: pageData.error,
              message: pageData.error?.message,
              description: pageData.error?.description,
            };
          } catch (e) {
            const descMatch = responseText.match(/description:\s*"([^"]+)"/i);
            const msgMatch = responseText.match(/message:\s*"([^"]+)"/i);
            if (descMatch || msgMatch) {
              errorDetails = {
                message: msgMatch?.[1],
                description: descMatch?.[1],
              };
            }
          }
        }
      }
      
      return new NextResponse(
        JSON.stringify({ 
          error: "No authorization code received", 
          status: response.status,
          details: errorDetails,
          fullResponse: responseText.substring(0, 3000),
        }),
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

