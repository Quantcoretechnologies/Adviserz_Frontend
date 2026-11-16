import { env } from "@/config/env";
import { ClientErrorCode, type ErrorCode } from "./error-codes";
import { ApiError } from "./errors";

/** Success envelope returned by every API endpoint. */
interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

interface ApiErrorBody {
  success: false;
  message: string;
  code: ErrorCode;
  data: null;
  details?: unknown;
  requestId: string;
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON-serialisable request body. */
  body?: unknown;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  /** Sent as `Authorization: Bearer <token>`. */
  accessToken?: string;
  /** Sent as `X-CSRF-Token`; required by cookie-authenticated endpoints. */
  csrfToken?: string;
  signal?: AbortSignal;
  /** Defaults to 15 seconds. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    `${env.NEXT_PUBLIC_API_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function parseRetryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get("Retry-After"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

function isEnvelope(
  value: unknown,
): value is ApiSuccessBody<unknown> | ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { success?: unknown }).success === "boolean"
  );
}

/**
 * Low-level API call. Resolves with the envelope's `data`; rejects with an
 * `ApiError` for every failure (HTTP error, network failure, timeout, or a
 * response that is not a valid envelope).
 *
 * Cookies are always included so the backend's refresh/CSRF cookies work.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    headers,
    accessToken,
    csrfToken,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    });
  } catch (cause) {
    // A caller-initiated abort is not an API failure; let it propagate as-is.
    if (signal?.aborted) throw cause;

    if (timeoutSignal.aborted) {
      throw new ApiError({
        status: 0,
        code: ClientErrorCode.TIMEOUT,
        message: "The request timed out. Please try again.",
        cause,
      });
    }
    throw new ApiError({
      status: 0,
      code: ClientErrorCode.NETWORK_ERROR,
      message:
        "Unable to reach the server. Check your connection and try again.",
      cause,
    });
  }

  const requestId = response.headers.get("X-Request-Id") ?? undefined;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new ApiError({
      status: response.status,
      code: ClientErrorCode.INVALID_RESPONSE,
      message: "The server returned an unexpected response.",
      requestId,
      cause,
    });
  }

  if (!isEnvelope(payload)) {
    throw new ApiError({
      status: response.status,
      code: ClientErrorCode.INVALID_RESPONSE,
      message: "The server returned an unexpected response.",
      requestId,
    });
  }

  if (!payload.success || !response.ok) {
    const failure = payload as Partial<ApiErrorBody>;
    throw new ApiError({
      status: response.status,
      code: failure.code ?? ClientErrorCode.INVALID_RESPONSE,
      message: failure.message ?? "The request failed.",
      details: failure.details,
      requestId: failure.requestId ?? requestId,
      retryAfterSeconds: parseRetryAfter(response),
    });
  }

  return payload.data as T;
}

type BodylessOptions = Omit<RequestOptions, "method" | "body">;

export const api = {
  get: <T>(path: string, options?: BodylessOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: BodylessOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: BodylessOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
