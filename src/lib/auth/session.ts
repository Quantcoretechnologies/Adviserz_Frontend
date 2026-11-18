import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from "@/config/auth";
import { deleteCookie, readCookie, writeCookie } from "@/lib/utils/cookies";

/**
 * The browser's session.
 *
 * - Access token: kept in a cookie that expires with the token, so a reload
 *   keeps the user signed in. It is short-lived (minutes).
 * - Refresh token: an HttpOnly cookie owned by the API; this app can never
 *   read it. It is exchanged for a new access token in `refreshAccessToken`.
 * - CSRF token: a readable cookie set by the API alongside the refresh
 *   cookie, echoed back in a header on refresh and sign-out.
 */
export interface IssuedAccessToken {
  accessToken: string;
  /** ISO timestamp. */
  accessTokenExpiresAt: string;
}

export const authSession = {
  getAccessToken: (): string | null => readCookie(ACCESS_TOKEN_COOKIE),

  getCsrfToken: (): string | null => readCookie(CSRF_COOKIE),

  /** True when signed in, or when a refresh could restore the session. */
  exists: (): boolean =>
    readCookie(ACCESS_TOKEN_COOKIE) !== null ||
    readCookie(CSRF_COOKIE) !== null,

  set: ({ accessToken, accessTokenExpiresAt }: IssuedAccessToken): void => {
    writeCookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      new Date(accessTokenExpiresAt),
    );
  },

  clear: (): void => {
    deleteCookie(ACCESS_TOKEN_COOKIE);
  },
};
