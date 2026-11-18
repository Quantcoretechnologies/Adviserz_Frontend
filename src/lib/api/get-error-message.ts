import { isApiError } from "./errors";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** User-facing text for any thrown value. API messages are written for end users. */
export function getErrorMessage(error: unknown): string {
  return isApiError(error) ? error.message : FALLBACK_MESSAGE;
}
