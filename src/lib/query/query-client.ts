import { isServer, QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

const MAX_QUERY_RETRIES = 2;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // Retry only failures that can succeed on a second attempt: network
        // errors, timeouts and 5xx. A 4xx is the server's final answer.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < MAX_QUERY_RETRIES;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * One client per request on the server (so data never leaks between users),
 * and a single shared client in the browser.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
