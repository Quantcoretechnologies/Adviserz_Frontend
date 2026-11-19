"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ADMIN_ROUTES, ROUTES } from "@/config/routes";
import { refreshAccessToken, refreshAdminAccessToken } from "@/lib/api";
import { adminSession, authSession } from "@/lib/auth/session";

/** Which session to look at, and where a signed-in person belongs. */
const SCOPES = {
  user: {
    session: authSession,
    refresh: refreshAccessToken,
    home: ROUTES.home,
  },
  admin: {
    session: adminSession,
    refresh: refreshAdminAccessToken,
    home: ADMIN_ROUTES.home,
  },
} as const;

/**
 * Sends a visitor who is already signed in away from the auth pages.
 *
 * The proxy handles the common case (a live access token). This covers the
 * other one: the access token has expired but the refresh cookie is still
 * valid, which only a refresh attempt can tell.
 */
export function RedirectIfSignedIn({
  scope = "user",
}: {
  scope?: keyof typeof SCOPES;
}) {
  const router = useRouter();

  useEffect(() => {
    const { session, refresh, home } = SCOPES[scope];
    if (session.getAccessToken()) {
      router.replace(home);
      return;
    }
    if (!session.getCsrfToken()) return;

    let cancelled = false;
    refresh()
      .then(() => {
        if (!cancelled) router.replace(home);
      })
      // Not signed in after all: stay on the page. The API clears its stale cookies.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router, scope]);

  return null;
}
