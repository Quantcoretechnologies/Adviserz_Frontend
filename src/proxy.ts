import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_CSRF_COOKIE,
  CSRF_COOKIE,
} from "@/config/auth";
import {
  ADMIN_PREFIX,
  ADMIN_ROUTES,
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
 * The admin console follows the same two rules with its own cookies and its
 * own sign-in page, so the customer and staff sessions never mix.
 *
 * This only avoids flashing the wrong page. The API is what actually
 * enforces access: every request is checked against the access token.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, [ADMIN_PREFIX])) {
    return adminProxy(request, pathname);
  }

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

function adminProxy(request: NextRequest, pathname: string) {
  const hasAccessToken = request.cookies.has(ADMIN_ACCESS_TOKEN_COOKIE);
  const canRefresh = request.cookies.has(ADMIN_CSRF_COOKIE);

  if (matchesPrefix(pathname, [ADMIN_ROUTES.login])) {
    return hasAccessToken
      ? NextResponse.redirect(new URL(ADMIN_ROUTES.home, request.url))
      : NextResponse.next();
  }

  if (!hasAccessToken && !canRefresh) {
    return NextResponse.redirect(new URL(ADMIN_ROUTES.login, request.url));
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
    "/risk-notice/:path*",
    "/admin/:path*",
  ],
};
