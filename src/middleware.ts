import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/**
 * Everything is behind the login wall. Middleware only checks the JWT
 * signature — no database round-trip on the hot path. Route handlers and
 * server actions re-check authorisation before touching data.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(url);
    // Clear a cookie that failed verification so the user is not stuck.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the media folder and metadata files.
     * Auth server actions post to the page they live on, so they stay covered.
     */
    "/((?!_next/static|_next/image|media/|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
