import { SignJWT, jwtVerify } from "jose";

/**
 * Lazy : la clé n'est résolue qu'au premier usage (un throw au top-level
 * casserait l'évaluation du module au build si AUTH_SECRET n'est pas encore
 * défini). Le secret DOIT exister à l'exécution des routes/proxy.
 */
function getKey(): Uint8Array {
  const AUTH_SECRET = process.env.AUTH_SECRET;
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(AUTH_SECRET);
}

export const SESSION_COOKIE_NAME = "wt_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(payload: Record<string, unknown>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getKey());
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload;
  } catch {
    return null;
  }
}

// ─────────────────────── Rôles & session ───────────────────────

export type UserRole = "admin" | "editor" | "viewer";

/** Session extraite du JWT (payload minimal, sans données sensibles). */
export interface Session {
  sub: string;
  email: string;
  role: UserRole;
  name?: string;
}

const VALID_ROLES = ["admin", "editor", "viewer"] as const;

/**
 * Contrôle de forme du payload et conversion en Session (source de vérité
 * partagée : le dashboard client via /api/auth/me, et l'API PHP qui
 * revalide le JWT à chaque requête).
 * Un payload non conforme (champs manquants, rôle inconnu) est traité
 * comme non authentifié → null.
 */
export function toSession(
  payload: Record<string, unknown> | null
): Session | null {
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    !(VALID_ROLES as readonly string[]).includes(payload.role as string)
  ) {
    return null;
  }
  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role as UserRole,
    ...(typeof payload.name === "string" ? { name: payload.name } : {}),
  };
}

/**
 * Contrôle de forme minimal du payload de session (utilisé par proxy.ts).
 * Un payload non conforme est traité comme non authentifié.
 */
export function isSessionPayload(
  payload: Record<string, unknown> | null
): boolean {
  return toSession(payload) !== null;
}

/**
 * Set session cookie in response headers
 */
export function setSessionCookie(response: Headers, token: string): void {
  response.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; ${Object.entries(COOKIE_OPTIONS)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ")}`
  );
}

/**
 * Remove session cookie (for logout)
 */
export function unsetSessionCookie(response: Headers): void {
  response.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=deleted; ${Object.entries(COOKIE_OPTIONS)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ")}; Max-Age=0`
  );
}

/**
 * Extract session token from request cookies
 */
export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((pair) => pair.split("="))
  );
  return cookies[SESSION_COOKIE_NAME] ?? null;
}
