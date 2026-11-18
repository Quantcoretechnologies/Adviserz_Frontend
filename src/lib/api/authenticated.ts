import { ROUTES } from "@/config/routes";
import { authSession, type IssuedAccessToken } from "@/lib/auth/session";
import { apiRequest, type RequestOptions } from "./client";
import { ErrorCode } from "./error-codes";
import { ApiError, isApiError } from "./errors";

type AuthedOptions = Omit<RequestOptions, "accessToken">;

/** Errors that mean "this access token is no longer good; get a new one". */
const STALE_TOKEN_CODES: readonly string[] = [
  ErrorCode.ACCESS_TOKEN_EXPIRED,
  ErrorCode.ACCESS_TOKEN_INVALID,
];

const ROTATION_RACE_DELAY_MS = 400;

let refreshInFlight: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const csrfToken = authSession.getCsrfToken();
  if (!csrfToken) {
    throw new ApiError({
      status: 401,
      code: ErrorCode.UNAUTHENTICATED,
      message: "Please sign in to continue.",
    });
  }

  try {
    const issued = await apiRequest<IssuedAccessToken>("/auth/web/refresh", {
      method: "POST",
      csrfToken,
    });
    authSession.set(issued);
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
      const token = authSession.getAccessToken();
      if (token) return token;
    }
    throw error;
  }
}

/**
 * Exchange the refresh cookie for a new access token. Concurrent callers
 * share one request, because a refresh token can only be used once.
 */
export function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= requestNewAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** The session cannot be restored: forget it and go to the login page. */
function endSession(): void {
  authSession.clear();
  if (typeof window !== "undefined") window.location.assign(ROUTES.login);
}

async function accessTokenOrSignOut(forceRefresh: boolean): Promise<string> {
  const existing = forceRefresh ? null : authSession.getAccessToken();
  if (existing) return existing;
  try {
    return await refreshAccessToken();
  } catch (error) {
    // 401/403 = the refresh token is gone or revoked. Anything else (network,
    // 5xx) is temporary, so the session is kept and the error is surfaced.
    if (isApiError(error) && (error.status === 401 || error.status === 403)) {
      endSession();
    }
    throw error;
  }
}

/**
 * Call an endpoint that needs a signed-in user. Attaches the access token,
 * refreshing it first when missing and once more if the API rejects it.
 */
export async function authedRequest<T>(
  path: string,
  options: AuthedOptions = {},
): Promise<T> {
  const accessToken = await accessTokenOrSignOut(false);
  try {
    return await apiRequest<T>(path, { ...options, accessToken });
  } catch (error) {
    if (!isApiError(error) || !STALE_TOKEN_CODES.includes(error.code)) {
      throw error;
    }
    const renewed = await accessTokenOrSignOut(true);
    return apiRequest<T>(path, { ...options, accessToken: renewed });
  }
}

type BodylessOptions = Omit<AuthedOptions, "method" | "body">;

/** Same shape as `api`, for endpoints that need a signed-in user. */
export const authedApi = {
  get: <T>(path: string, options?: BodylessOptions) =>
    authedRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
    authedRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
    authedRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
    authedRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: BodylessOptions) =>
    authedRequest<T>(path, { ...options, method: "DELETE" }),
};
