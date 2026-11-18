import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from "@/config/auth";
import {
  GUEST_ONLY_PREFIXES,
  matchesPrefix,
  PROTECTED_PREFIXES,
  ROUTES,
} from "@/config/routes";

/**
 * Optimistic route protection, decided from cookies alone (no API call):
 *
 * - A protected page without any session cookie goes to the login page.
 * - A guest-only page (login, signup, ...) with a live access token goes to
 *   the home page.
 *
 * This only avoids flashing the wrong page. The API is what actually
 * enforces access: every request is checked against the access token.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const canRefresh = request.cookies.has(CSRF_COOKIE);

  if (
    matchesPrefix(pathname, PROTECTED_PREFIXES) &&
    !hasAccessToken &&
    !canRefresh
  ) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  if (matchesPrefix(pathname, GUEST_ONLY_PREFIXES) && hasAccessToken) {
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/signup/:path*",
    "/forgot-password/:path*",
    "/onboarding/:path*",
  ],
};
