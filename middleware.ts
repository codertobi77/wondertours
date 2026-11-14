import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { method, url, headers } = request;
  const userAgent = headers.get("user-agent") || "unknown";
  const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";
  const referer = headers.get("referer") || "none";

  // Log the request
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      method,
      url: request.nextUrl.pathname,
      query: request.nextUrl.search,
      ip,
      userAgent,
      referer,
    })
  );

  const response = NextResponse.next();

  // Add response time header
  response.headers.set("X-Response-Time", `${Date.now() - start}ms`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};