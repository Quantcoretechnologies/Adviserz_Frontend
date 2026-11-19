import {
  ACCESS_TOKEN_COOKIE,
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_CSRF_COOKIE,
  CSRF_COOKIE,
} from "@/config/auth";
import { deleteCookie, readCookie, writeCookie } from "@/lib/utils/cookies";

/**
 * A browser session.
 *
 * - Access token: kept in a cookie that expires with the token, so a reload
 *   keeps the person signed in. It is short-lived (minutes).
 * - Refresh token: an HttpOnly cookie owned by the API; this app can never
 *   read it. It is exchanged for a new access token by the authed API client.
 * - CSRF token: a readable cookie set by the API alongside the refresh
 *   cookie, echoed back in a header on refresh and sign-out.
 *
 * The customer app and the admin console each have their own session, in
 * separate cookies, so signing in to one never affects the other.
 */
export interface IssuedAccessToken {
  accessToken: string;
  /** ISO timestamp. */
  accessTokenExpiresAt: string;
}

export interface AuthSession {
  getAccessToken: () => string | null;
  getCsrfToken: () => string | null;
  /** True when signed in, or when a refresh could restore the session. */
  exists: () => boolean;
  set: (issued: IssuedAccessToken) => void;
  clear: () => void;
}

export function createAuthSession(cookies: {
  accessToken: string;
  csrf: string;
}): AuthSession {
  return {
    getAccessToken: () => readCookie(cookies.accessToken),

    getCsrfToken: () => readCookie(cookies.csrf),

    exists: () =>
      readCookie(cookies.accessToken) !== null ||
      readCookie(cookies.csrf) !== null,

    set: ({ accessToken, accessTokenExpiresAt }) => {
      writeCookie(
        cookies.accessToken,
        accessToken,
        new Date(accessTokenExpiresAt),
      );
    },

    clear: () => {
      deleteCookie(cookies.accessToken);
    },
  };
}

/** The customer's session. */
export const authSession = createAuthSession({
  accessToken: ACCESS_TOKEN_COOKIE,
  csrf: CSRF_COOKIE,
});

/** The staff member's session in the admin console. */
export const adminSession = createAuthSession({
  accessToken: ADMIN_ACCESS_TOKEN_COOKIE,
  csrf: ADMIN_CSRF_COOKIE,
});
