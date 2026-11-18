"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { refreshAccessToken } from "@/lib/api";
import { authSession } from "@/lib/auth/session";

/**
 * Sends a visitor who is already signed in away from the auth pages.
 *
 * The proxy handles the common case (a live access token). This covers the
 * other one: the access token has expired but the refresh cookie is still
 * valid, which only a refresh attempt can tell.
 */
export function RedirectIfSignedIn() {
  const router = useRouter();

  useEffect(() => {
    if (authSession.getAccessToken()) {
      router.replace(ROUTES.home);
      return;
    }
    if (!authSession.getCsrfToken()) return;

    let cancelled = false;
    refreshAccessToken()
      .then(() => {
        if (!cancelled) router.replace(ROUTES.home);
      })
      // Not signed in after all: stay on the page. The API clears its stale cookies.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
