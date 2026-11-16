import type { ClientErrorCode, ErrorCode } from "./error-codes";

export type ApiErrorCode = ErrorCode | ClientErrorCode;

interface ApiErrorInit {
  /** HTTP status; 0 when the request never produced a response. */
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  requestId?: string;
  /** Seconds to wait before retrying, from the Retry-After header. */
  retryAfterSeconds?: number;
  cause?: unknown;
}

/** The single error type thrown by the API client. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause });
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.requestId = init.requestId;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  is(code: ApiErrorCode): boolean {
    return this.code === code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
