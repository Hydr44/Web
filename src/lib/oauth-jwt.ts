/**
 * Tipi e helper per i JWT custom emessi dal nostro OAuth interno.
 * Sostituisce i `jwt.verify(...) as any` sparsi nelle route con un
 * `verifyOAuthToken` tipato che valida runtime + ritorna un payload
 * tipato (o null se non valido).
 */

import jwt from "jsonwebtoken";

export interface OAuthJWTPayload {
  user_id: string;
  app_id: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

function isOAuthJWTPayload(x: unknown): x is OAuthJWTPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.user_id === "string" &&
    typeof o.app_id === "string" &&
    (o.type === "access" || o.type === "refresh")
  );
}

/**
 * Verifica un JWT OAuth interno e ritorna il payload tipato.
 * Ritorna `null` se il token è invalido, scaduto, o la forma non matcha
 * (anziché throw, così le route possono fare un return 401 pulito).
 */
export function verifyOAuthToken(token: string, secret: string): OAuthJWTPayload | null {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") return null;
    if (!isOAuthJWTPayload(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}
