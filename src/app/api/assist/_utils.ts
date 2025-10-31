import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": process.env.ASSIST_ALLOW_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function jsonWithCors(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init));
}

export function emptyCorsResponse(status: number) {
  return withCors(new NextResponse(null, { status }));
}

export function getAssistBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_ASSIST_PUBLIC_URL ||
    process.env.ASSIST_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  const fallback = "http://localhost:3000";
  const url = (envUrl || fallback).replace(/\/+$/, "");
  return url;
}

export function buildAssistUrl(token: string) {
  const base = getAssistBaseUrl();
  return `${base}/assist/${token}`;
}

export function generateAssistToken() {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  return uuid.slice(0, 12);
}

export function sanitizePhone(input: unknown) {
  if (typeof input !== "string") return "";
  return input.replace(/[^0-9+]/g, "").slice(0, 32);
}

export function sanitizeNote(input: unknown) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed.length ? trimmed.slice(0, 1000) : null;
}

export async function fetchRequestByToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from("assistance_requests")
    .select("id, org_id, phone, note, token, url, status, lat, lng, accuracy, created_at, updated_at, received_at, closed_at")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export { supabaseAdmin };

