import { adminAuthedApi } from "@/lib/api";
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
  StaffDetail,
  StaffRolesResult,
  StaffTree,
  StaffWithCredentials,
  UpdateStaffInput,
} from "./admin-access.types";

const preview = (value: boolean) => ({ query: { preview: value } });

/**
 * Raw calls to the staff, role and permission endpoints. Components never
 * call these directly; they go through the hooks in ../hooks.
 *
 * Calls that take `asPreview` run the real change on the server and roll it
 * back, returning what it would affect. Nothing is saved by a preview.
 */
export const adminAccessApi = {
  permissionCatalog: () =>
    adminAuthedApi.get<PermissionCatalog>("/admin/permissions"),

  // Roles
  listRoles: (params: ListRolesParams = {}) =>
    adminAuthedApi.get<Paginated<Role>>("/admin/roles", {
      query: { ...params },
    }),
  getRole: (id: string) =>
    adminAuthedApi
      .get<{ role: RoleDetail }>(`/admin/roles/${id}`)
      .then((data) => data.role),
  createRole: (body: RoleInput) =>
    adminAuthedApi
      .post<{ role: RoleDetail }>("/admin/roles", body)
      .then((data) => data.role),
  updateRole: (id: string, body: RoleInput, asPreview: boolean) =>
    adminAuthedApi.patch<RoleChangeResult>(
      `/admin/roles/${id}`,
      body,
      preview(asPreview),
    ),
  roleDeletionImpact: (id: string) =>
    adminAuthedApi.get<RoleDeletionResult>(
      `/admin/roles/${id}/deletion-impact`,
    ),
  deleteRole: (id: string) =>
    adminAuthedApi.delete<RoleDeletionResult>(`/admin/roles/${id}`),

  // Staff
  listStaff: (params: ListStaffParams = {}) =>
    adminAuthedApi.get<Paginated<Staff>>("/admin/staff", {
      query: { ...params },
    }),
  staffTree: () => adminAuthedApi.get<StaffTree>("/admin/staff/tree"),
  getStaff: (id: string) =>
    adminAuthedApi.get<StaffDetail>(`/admin/staff/${id}`),
  createStaff: (body: CreateStaffInput) =>
    adminAuthedApi.post<StaffWithCredentials>("/admin/staff", body),
  updateStaff: (id: string, body: UpdateStaffInput) =>
    adminAuthedApi
      .patch<{ staff: Staff }>(`/admin/staff/${id}`, body)
      .then((data) => data.staff),
  setStaffRoles: (id: string, roleIds: string[], asPreview: boolean) =>
    adminAuthedApi.put<StaffRolesResult>(
      `/admin/staff/${id}/roles`,
      { roleIds },
      preview(asPreview),
    ),
  blockStaff: (id: string, reason: string) =>
    adminAuthedApi
      .post<{ staff: Staff }>(`/admin/staff/${id}/block`, { reason })
      .then((data) => data.staff),
  unblockStaff: (id: string) =>
    adminAuthedApi
      .post<{ staff: Staff }>(`/admin/staff/${id}/unblock`)
      .then((data) => data.staff),
  resetStaffPassword: (id: string) =>
    adminAuthedApi.post<StaffWithCredentials>(
      `/admin/staff/${id}/reset-password`,
    ),
  staffDeletionImpact: (id: string) =>
    adminAuthedApi.get<StaffDeletionResult>(
      `/admin/staff/${id}/deletion-impact`,
    ),
  deleteStaff: (id: string) =>
    adminAuthedApi.delete<StaffDeletionResult>(`/admin/staff/${id}`),
};

/** All under "admin", so signing out drops them with everything else. */
export const adminAccessKeys = {
  catalog: ["admin", "permission-catalog"] as const,
  roles: ["admin", "roles"] as const,
  roleList: (params: ListRolesParams) =>
    ["admin", "roles", "list", params] as const,
  role: (id: string) => ["admin", "roles", "detail", id] as const,
  staff: ["admin", "staff"] as const,
  staffList: (params: ListStaffParams) =>
    ["admin", "staff", "list", params] as const,
  staffTree: ["admin", "staff", "tree"] as const,
  /**
   * Kept outside "roles" and "staff" on purpose: refreshing those after a
   * delete must not ask again what deleting the (now deleted) record would do.
   */
  roleDeletionImpact: (id: string) =>
    ["admin", "deletion-impact", "role", id] as const,
  staffDeletionImpact: (id: string) =>
    ["admin", "deletion-impact", "staff", id] as const,
};
