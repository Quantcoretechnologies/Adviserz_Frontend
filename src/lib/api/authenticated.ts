import { ADMIN_ROUTES, ROUTES } from "@/config/routes";
import {
  adminSession,
  authSession,
  type AuthSession,
  type IssuedAccessToken,
} from "@/lib/auth/session";
import { apiRequest, type RequestOptions } from "./client";
import { ErrorCode } from "./error-codes";
import { ApiError, isApiError } from "./errors";

type AuthedOptions = Omit<RequestOptions, "accessToken">;
type BodylessOptions = Omit<AuthedOptions, "method" | "body">;

/** Errors that mean "this access token is no longer good; get a new one". */
const STALE_TOKEN_CODES: readonly string[] = [
  ErrorCode.ACCESS_TOKEN_EXPIRED,
  ErrorCode.ACCESS_TOKEN_INVALID,
];

const ROTATION_RACE_DELAY_MS = 400;

interface AuthedClientConfig {
  session: AuthSession;
  /** Endpoint that exchanges the refresh cookie for a new access token. */
  refreshPath: string;
  /** Where to send the person when the session cannot be restored. */
  signInRoute: string;
  /** API error codes after which a refresh is attempted before giving up. */
  staleTokenCodes?: readonly string[];
}

/**
 * An API client for endpoints that need a signed-in person. It attaches the
 * access token, refreshes it when missing or rejected, and sends the person
 * to the sign-in page when the session is truly over.
 *
 * The customer app and the admin console each get one, bound to their own
 * session, so the refresh logic exists once.
 */
function createAuthedClient({
  session,
  refreshPath,
  signInRoute,
  staleTokenCodes = STALE_TOKEN_CODES,
}: AuthedClientConfig) {
  let refreshInFlight: Promise<string> | null = null;
  let sessionEnded = false;

  async function requestNewAccessToken(): Promise<string> {
    const csrfToken = session.getCsrfToken();
    if (!csrfToken) {
      throw new ApiError({
        status: 401,
        code: ErrorCode.UNAUTHENTICATED,
        message: "Please sign in to continue.",
      });
    }

    try {
      const issued = await apiRequest<IssuedAccessToken>(refreshPath, {
        method: "POST",
        csrfToken,
      });
      session.set(issued);
      return issued.accessToken;
    } catch (error) {
      // Another tab refreshed a moment ago. Its response has already set the
      // new cookies, so the token it obtained is the one to use.
      if (
        isApiError(error) &&
        error.is(ErrorCode.REFRESH_TOKEN_ALREADY_ROTATED)
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, ROTATION_RACE_DELAY_MS),
        );
        const token = session.getAccessToken();
        if (token) return token;
      }
      throw error;
    }
  }

  /**
   * Exchange the refresh cookie for a new access token. Concurrent callers
   * share one request, because a refresh token can only be used once.
   */
  function refreshAccessToken(): Promise<string> {
    refreshInFlight ??= requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  /** The session cannot be restored: forget it and go to the sign-in page. */
  function endSession(): void {
    sessionEnded = true;
    session.clear();
    if (typeof window !== "undefined") window.location.assign(signInRoute);
  }

  async function accessTokenOrSignOut(forceRefresh: boolean): Promise<string> {
    const existing = forceRefresh ? null : session.getAccessToken();
    if (existing) return existing;
    try {
      return await refreshAccessToken();
    } catch (error) {
      // 401/403 = the refresh token is gone or revoked. Anything else
      // (network, 5xx) is temporary, so the session is kept and the error is
      // surfaced.
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        endSession();
      }
      throw error;
    }
  }

  /**
   * Call an endpoint that needs a signed-in person. Attaches the access
   * token, refreshing it first when missing and once more if the API
   * rejects it.
   */
  async function request<T>(
    path: string,
    options: AuthedOptions = {},
  ): Promise<T> {
    const accessToken = await accessTokenOrSignOut(false);
    try {
      return await apiRequest<T>(path, { ...options, accessToken });
    } catch (error) {
      if (!isApiError(error) || !staleTokenCodes.includes(error.code)) {
        throw error;
      }
      const renewed = await accessTokenOrSignOut(true);
      return apiRequest<T>(path, { ...options, accessToken: renewed });
    }
  }

  return {
    request,
    refreshAccessToken,
    /**
     * True once this client has given up on the session and started sending
     * the browser to the sign-in page. Screens use it to avoid showing an
     * error for a request that failed only because the session is over.
     */
    hasEndedSession: () => sessionEnded,
    /** Same shape as `api`, for endpoints that need a signed-in person. */
    api: {
      get: <T>(path: string, options?: BodylessOptions) =>
        request<T>(path, { ...options, method: "GET" }),
      post: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
        request<T>(path, { ...options, method: "POST", body }),
      put: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
        request<T>(path, { ...options, method: "PUT", body }),
      patch: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
        request<T>(path, { ...options, method: "PATCH", body }),
      delete: <T>(path: string, options?: BodylessOptions) =>
        request<T>(path, { ...options, method: "DELETE" }),
    },
  };
}

// --- Customer app ------------------------------------------------------------

const userClient = createAuthedClient({
  session: authSession,
  refreshPath: "/auth/web/refresh",
  signInRoute: ROUTES.login,
});

export const authedRequest = userClient.request;
export const authedApi = userClient.api;
export const refreshAccessToken = userClient.refreshAccessToken;

// --- Admin console -----------------------------------------------------------

const adminClient = createAuthedClient({
  session: adminSession,
  refreshPath: "/admin/auth/refresh",
  signInRoute: ADMIN_ROUTES.login,
  // A staff member can be blocked, deleted or have their password reset at
  // any moment, which revokes their sessions. The refresh that follows then
  // fails and they are sent to the sign-in page instead of being left on a
  // screen where nothing works.
  staleTokenCodes: [
    ...STALE_TOKEN_CODES,
    ErrorCode.SESSION_REVOKED,
    ErrorCode.SESSION_EXPIRED,
  ],
});

/** For the admin console's endpoints (`/admin/...`). */
export const adminAuthedApi = adminClient.api;
export const refreshAdminAccessToken = adminClient.refreshAccessToken;
export const hasAdminSessionEnded = adminClient.hasEndedSession;
