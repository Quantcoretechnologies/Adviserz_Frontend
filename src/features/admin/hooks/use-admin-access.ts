import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/api";
import { adminAccessApi, adminAccessKeys } from "../api/admin-access.api";
import type {
  CreateStaffInput,
  ListRolesParams,
  ListStaffParams,
  Paginated,
  PermissionCatalog,
  Role,
  RoleChangeResult,
  RoleDeletionResult,
  RoleDetail,
  RoleInput,
  Staff,
  StaffDeletionResult,
  StaffRolesResult,
  StaffTree,
  StaffWithCredentials,
  UpdateStaffInput,
} from "../api/admin-access.types";

/**
 * Staff and roles depend on each other (a role lists its holders, a staff
 * member lists their roles, and a change can strip roles further down), so
 * every successful change refreshes both.
 */
function useRefreshAccess() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminAccessKeys.roles }),
      queryClient.invalidateQueries({ queryKey: adminAccessKeys.staff }),
    ]);
}

// --- Queries -------------------------------------------------------------------

/** Every permission that exists, with a flag for the ones the caller holds. */
export function usePermissionCatalog(enabled = true) {
  return useQuery<PermissionCatalog, ApiError>({
    queryKey: adminAccessKeys.catalog,
    queryFn: adminAccessApi.permissionCatalog,
    enabled,
  });
}

export function useRoles(params: ListRolesParams, enabled = true) {
  return useQuery<Paginated<Role>, ApiError>({
    queryKey: adminAccessKeys.roleList(params),
    queryFn: () => adminAccessApi.listRoles(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useRole(id: string | null) {
  return useQuery<RoleDetail, ApiError>({
    queryKey: adminAccessKeys.role(id ?? ""),
    queryFn: () => adminAccessApi.getRole(id ?? ""),
    enabled: id !== null,
  });
}

export function useStaffList(params: ListStaffParams) {
  return useQuery<Paginated<Staff>, ApiError>({
    queryKey: adminAccessKeys.staffList(params),
    queryFn: () => adminAccessApi.listStaff(params),
    placeholderData: keepPreviousData,
  });
}

export function useStaffTree(enabled = true) {
  return useQuery<StaffTree, ApiError>({
    queryKey: adminAccessKeys.staffTree,
    queryFn: adminAccessApi.staffTree,
    enabled,
  });
}

// --- Role changes --------------------------------------------------------------

export function useCreateRole() {
  const refresh = useRefreshAccess();
  return useMutation<RoleDetail, ApiError, RoleInput>({
    mutationFn: adminAccessApi.createRole,
    onSuccess: refresh,
  });
}

/** `preview: true` only reports what the change would strip; nothing is saved. */
export function useUpdateRole() {
  const refresh = useRefreshAccess();
  return useMutation<
    RoleChangeResult,
    ApiError,
    { id: string; input: RoleInput; preview: boolean }
  >({
    mutationFn: ({ id, input, preview }) =>
      adminAccessApi.updateRole(id, input, preview),
    onSuccess: (result) => (result.preview ? undefined : refresh()),
  });
}

/**
 * What deleting the role would do, asked fresh every time the confirmation
 * opens (never served from an earlier answer).
 */
export function useRoleDeletionImpact(id: string) {
  return useQuery<RoleDeletionResult, ApiError>({
    queryKey: adminAccessKeys.roleDeletionImpact(id),
    queryFn: () => adminAccessApi.roleDeletionImpact(id),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useDeleteRole() {
  const refresh = useRefreshAccess();
  return useMutation<RoleDeletionResult, ApiError, string>({
    mutationFn: adminAccessApi.deleteRole,
    onSuccess: refresh,
  });
}

// --- Staff changes -------------------------------------------------------------

export function useCreateStaff() {
  const refresh = useRefreshAccess();
  return useMutation<StaffWithCredentials, ApiError, CreateStaffInput>({
    mutationFn: adminAccessApi.createStaff,
    onSuccess: refresh,
  });
}

export function useUpdateStaff() {
  const refresh = useRefreshAccess();
  return useMutation<Staff, ApiError, { id: string; input: UpdateStaffInput }>({
    mutationFn: ({ id, input }) => adminAccessApi.updateStaff(id, input),
    onSuccess: refresh,
  });
}

/** `preview: true` only reports what the change would strip; nothing is saved. */
export function useSetStaffRoles() {
  const refresh = useRefreshAccess();
  return useMutation<
    StaffRolesResult,
    ApiError,
    { id: string; roleIds: string[]; preview: boolean }
  >({
    mutationFn: ({ id, roleIds, preview }) =>
      adminAccessApi.setStaffRoles(id, roleIds, preview),
    onSuccess: (result) => (result.preview ? undefined : refresh()),
  });
}

export function useBlockStaff() {
  const refresh = useRefreshAccess();
  return useMutation<Staff, ApiError, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => adminAccessApi.blockStaff(id, reason),
    onSuccess: refresh,
  });
}

export function useUnblockStaff() {
  const refresh = useRefreshAccess();
  return useMutation<Staff, ApiError, string>({
    mutationFn: adminAccessApi.unblockStaff,
    onSuccess: refresh,
  });
}

export function useResetStaffPassword() {
  const refresh = useRefreshAccess();
  return useMutation<StaffWithCredentials, ApiError, string>({
    mutationFn: adminAccessApi.resetStaffPassword,
    onSuccess: refresh,
  });
}

/**
 * What deleting the staff member would do, asked fresh every time the
 * confirmation opens (never served from an earlier answer).
 */
export function useStaffDeletionImpact(id: string) {
  return useQuery<StaffDeletionResult, ApiError>({
    queryKey: adminAccessKeys.staffDeletionImpact(id),
    queryFn: () => adminAccessApi.staffDeletionImpact(id),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useDeleteStaff() {
  const refresh = useRefreshAccess();
  return useMutation<StaffDeletionResult, ApiError, string>({
    mutationFn: adminAccessApi.deleteStaff,
    onSuccess: refresh,
  });
}
