import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { ADMIN_ROUTES } from "@/config/routes";
import type { ApiError } from "@/lib/api";
import { adminSession } from "@/lib/auth/session";
import { adminAuthApi, adminKeys } from "../api/admin-auth.api";
import type {
  AdminLoginRequest,
  AdminSignedInResponse,
  ChangeAdminPasswordRequest,
  CurrentAdminResponse,
  PermissionKey,
} from "../api/admin-auth.types";

const noopSubscribe = () => () => {};

/**
 * Whether this browser holds a staff session (or can restore one). `false`
 * during server rendering and until the page has hydrated.
 */
export function useHasAdminSession(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => adminSession.exists(),
    () => false,
  );
}

/** The signed-in staff member, their roles and their permissions. */
export function useCurrentAdmin() {
  const hasSession = useHasAdminSession();
  return useQuery<CurrentAdminResponse, ApiError>({
    queryKey: adminKeys.currentAdmin,
    queryFn: adminAuthApi.currentAdmin,
    enabled: hasSession,
  });
}

export interface Permissions {
  /** False until the staff member's permissions have loaded. */
  ready: boolean;
  isSuperAdmin: boolean;
  can: (permission: PermissionKey) => boolean;
  /** True when at least one of the permissions is held. */
  canAny: (permissions: readonly PermissionKey[]) => boolean;
}

/**
 * What the signed-in staff member may do. Use it to hide menus and buttons
 * they cannot use. This is a convenience only: the API checks every
 * permission itself, so hiding something here never grants or removes access.
 */
export function usePermissions(): Permissions {
  const { data } = useCurrentAdmin();
  return useMemo(() => {
    const held = new Set(data?.permissions ?? []);
    const can = (permission: PermissionKey) => held.has(permission);
    return {
      ready: data !== undefined,
      isSuperAdmin: data?.admin.isSuperAdmin ?? false,
      can,
      canAny: (permissions) => permissions.some(can),
    };
  }, [data]);
}

/** Sign in to the admin console with email and password. */
export function useAdminLogin() {
  const queryClient = useQueryClient();
  return useMutation<AdminSignedInResponse, ApiError, AdminLoginRequest>({
    mutationFn: adminAuthApi.login,
    onSuccess: (data) => {
      adminSession.set(data);
      queryClient.removeQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Change the signed-in staff member's own password. Also how a generated
 * password is replaced at first sign-in.
 */
export function useChangeAdminPassword() {
  const queryClient = useQueryClient();
  return useMutation<
    { revokedSessions: number },
    ApiError,
    ChangeAdminPasswordRequest
  >({
    mutationFn: adminAuthApi.changePassword,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.currentAdmin }),
  });
}

/**
 * Sign out of the admin console. The local session is always cleared, even
 * if the server call fails, so nobody is stuck signed in on a shared machine.
 */
export function useAdminLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation<null, ApiError, void>({
    mutationFn: async () => {
      const csrfToken = adminSession.getCsrfToken();
      return csrfToken ? adminAuthApi.logout(csrfToken) : null;
    },
    onSettled: () => {
      adminSession.clear();
      queryClient.removeQueries({ queryKey: adminKeys.all });
      router.replace(ADMIN_ROUTES.login);
    },
  });
}
