import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  toSession,
  verifySessionToken,
} from "@/lib/auth";

/**
 * Garde de session pour les pages /dashboard**.
 * (Next 16 : le middleware est renommé « proxy » — cf. la doc embarquée
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md)
 *
 * - Sans session valide → redirection vers /dashboard/login.
 * - Session valide sur la page de login → redirection vers /dashboard.
 * - /dashboard/users** (gestion des comptes) → admin uniquement.
 *
 * Les routes /api ne sont PAS couvertes ici : leur protection est assurée
 * par `handleProtectedRoute` dans chaque route handler (source de vérité).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? toSession(await verifySessionToken(token)) : null;
  const hasSession = session !== null;

  // Pages d'authentification accessibles sans session : connexion, mot de
  // passe oublié et réinitialisation (le token du lien fait foi pour le reset).
  const PUBLIC_AUTH_PAGES = [
    "/dashboard/login",
    "/dashboard/forgot-password",
    "/dashboard/reset-password",
  ];
  const isPublicAuthPage = PUBLIC_AUTH_PAGES.includes(pathname);
  const isLoginPage = pathname === "/dashboard/login";

  if (!hasSession && !isPublicAuthPage) {
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Gestion des comptes : réservée aux administrateurs.
  const isUsersArea =
    pathname === "/dashboard/users" || pathname.startsWith("/dashboard/users/");
  if (hasSession && isUsersArea && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
