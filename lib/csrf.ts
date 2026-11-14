import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const CSRF_SECRET = new TextEncoder().encode(
  process.env.CSRF_SECRET || process.env.AUTH_SECRET || "default-csrf-secret-change-in-production"
);

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

export async function generateCsrfToken(): Promise<string> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(CSRF_SECRET);
  return token;
}

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (existing) {
    try {
      await jwtVerify(existing, CSRF_SECRET);
      return existing;
    } catch {
      // Token expired or invalid, generate new one
    }
  }
  const token = await generateCsrfToken();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
  return token;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, CSRF_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function validateCsrfFromRequest(request: Request): Promise<boolean> {
  const token = request.headers.get(CSRF_HEADER_NAME);
  if (!token) return false;
  return validateCsrfToken(token);
}

export const CSRF_CONFIG = {
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,
};