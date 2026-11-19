import type { PermissionKey, RoleSummary } from "./admin-auth.types";

/** Shapes used by the staff, role and permission endpoints. Dates are ISO strings. */

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface PersonRef {
  id: string;
  fullName: string;
}

// --- Permission catalog -------------------------------------------------------

export interface CatalogPermission {
  key: PermissionKey;
  action: string;
  label: string;
  description: string;
  /** Permissions that must be ticked together with this one. */
  requires: PermissionKey[];
  /** Whether the signed-in staff member holds it, and so may hand it down. */
  granted: boolean;
}

export interface CatalogModule {
  key: string;
  label: string;
  permissions: CatalogPermission[];
}

export interface PermissionCatalog {
  modules: CatalogModule[];
}

// --- Roles ---------------------------------------------------------------------

export interface Role {
  id: string;
  name: string;
  description: string | null;
  owner: PersonRef;
  permissions: PermissionKey[];
  holderCount: number;
  /** True when the signed-in staff member may edit or delete this role. */
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleHolder {
  id: string;
  fullName: string;
  email: string;
  status?: StaffStatus;
}

export interface RoleDetail extends Role {
  holders: RoleHolder[];
  /** What the role's owner holds: the most the role itself can contain. */
  ownerPermissions: string[];
}

export interface RoleInput {
  name: string;
  description: string | null;
  permissions: PermissionKey[];
}

/** What a change strips from the roles further down the hierarchy. */
export interface Cascade {
  roles: {
    id: string;
    name: string;
    ownerId: string;
    revoked: PermissionKey[];
  }[];
  affectedAdminIds: string[];
}

export interface RoleChangeResult {
  preview: boolean;
  /** The role as it is after the change (or would be, for a preview). */
  role: RoleDetail;
  cascade: Cascade;
}

export interface RoleDeletionResult {
  preview: boolean;
  role: RoleSummary;
  /** Staff who lose the role. Their accounts are kept. */
  holders: RoleHolder[];
  cascade: Cascade;
}

export interface ListRolesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Only roles created by this staff member. */
  ownerId?: string;
  /** Only roles the signed-in staff member created. */
  mine?: boolean;
}

// --- Staff ---------------------------------------------------------------------

export type StaffStatus = "active" | "disabled";

export interface Staff {
  id: string;
  fullName: string;
  email: string;
  isSuperAdmin: boolean;
  status: StaffStatus;
  blockedAt: string | null;
  blockedReason: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  /** Who created the account. Absent for the original super admin. */
  createdBy: PersonRef | null;
  roles: RoleSummary[];
  /** True when the signed-in staff member may change this person. */
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffDetail {
  staff: Staff;
  permissions: PermissionKey[];
  directReports: number;
  rolesCreated: number;
}

/** Shown once, right after an account is created or its password is reset. */
export interface StaffCredentials {
  email: string;
  temporaryPassword: string;
}

export interface StaffWithCredentials {
  staff: Staff;
  credentials: StaffCredentials;
}

export interface CreateStaffInput {
  fullName: string;
  email: string;
  roleIds: string[];
  isSuperAdmin: boolean;
}

export interface UpdateStaffInput {
  fullName?: string;
  email?: string;
}

export interface StaffRolesResult {
  preview: boolean;
  staff: Staff;
  cascade: Cascade;
}

export interface StaffDeletionResult {
  preview: boolean;
  /** Marked deleted. The records are kept, never erased. */
  deleted: {
    staff: { id: string; fullName: string; email: string }[];
    roles: { id: string; name: string; ownerId: string }[];
  };
  /** Only when a super admin is deleted: what moves under whoever deletes them. */
  transferred: {
    staff: { id: string; fullName: string; email: string }[];
    roles: {
      id: string;
      name: string;
      ownerId: string;
      previousName: string;
    }[];
  };
}

export interface ListStaffParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: StaffStatus;
}

export interface StaffTreeNode {
  id: string;
  fullName: string;
  email: string;
  isSuperAdmin: boolean;
  status: StaffStatus;
  /** Null for the top of the part of the hierarchy this person can see. */
  parentId: string | null;
  roles: RoleSummary[];
  isSelf: boolean;
  canManage: boolean;
}

export interface StaffTree {
  rootIds: string[];
  nodes: StaffTreeNode[];
}
