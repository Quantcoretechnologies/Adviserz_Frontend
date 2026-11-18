import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ROUTES } from "@/config/routes";
import type { ApiError } from "@/lib/api";
import { authSession } from "@/lib/auth/session";
import { authApi, authKeys } from "../api/auth.api";
import type { CurrentUserResponse } from "../api/auth.types";

const noopSubscribe = () => () => {};

/**
 * Whether this browser holds a session (or can restore one). `false` during
 * server rendering and until the page has hydrated.
 */
export function useHasSession(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => authSession.exists(),
    () => false,
  );
}

/** The signed-in user and what they still have to complete. */
export function useCurrentUser() {
  const hasSession = useHasSession();
  return useQuery<CurrentUserResponse, ApiError>({
    queryKey: authKeys.currentUser,
    queryFn: authApi.currentUser,
    enabled: hasSession,
  });
}

/**
 * Sign out. The local session is always cleared, even if the server call
 * fails, so the user is never stuck signed in on this device.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation<null, ApiError, void>({
    mutationFn: async () => {
      const csrfToken = authSession.getCsrfToken();
      return csrfToken ? authApi.logout(csrfToken) : null;
    },
    onSettled: () => {
      authSession.clear();
      queryClient.clear();
      router.replace(ROUTES.login);
    },
  });
}
