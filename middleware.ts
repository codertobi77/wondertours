import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pages d'authentification : accessibles sans session.
  if (
    pathname === "/dashboard/login" ||
    pathname === "/dashboard/forgot-password" ||
    pathname === "/dashboard/reset-password"
  ) {
    return NextResponse.next();
  }

  // Protection des routes /dashboard/* : cookie de session requis.
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("wt_session")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};