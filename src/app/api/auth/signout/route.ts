import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Clears the session and sends the visitor to /login.
 *
 * Server Components cannot write cookies during render, so a page that finds
 * its session is stale — a signed token pointing at a tournament that no
 * longer exists — has to bounce through here. Redirecting straight to /login
 * instead would loop forever: middleware sees a structurally valid token and
 * sends the visitor back to /.
 */
export function GET(request: NextRequest) {
  const url = new URL("/login", request.url);
  const reason = request.nextUrl.searchParams.get("reason");
  if (reason) url.searchParams.set("reason", reason);

  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
