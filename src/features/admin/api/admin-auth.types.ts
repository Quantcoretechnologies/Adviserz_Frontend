/** Shapes used by the admin console's auth endpoints. Dates arrive as ISO strings. */

/**
 * A permission key such as `"users.block"`. The list is owned by the API
 * (GET /admin/permissions), so new permissions need no change here.
 */
export type PermissionKey = string;

export interface RoleSummary {
  id: string;
  name: string;
}

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  /** Holds every permission. Everyone else gets access from their roles. */
  isSuperAdmin: boolean;
  /** Signed in with a generated password: nothing works until it is replaced. */
  mustChangePassword: boolean;
  status: "active" | "disabled";
  lastLoginAt: string | null;
}

/** Returned by the admin sign-in endpoint. */
export interface AdminSignedInResponse {
  tokenType: "Bearer";
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
  csrfToken: string;
  admin: AdminAccount;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

/** The signed-in staff member and everything they may do right now. */
export interface CurrentAdminResponse {
  admin: AdminAccount & { roles: RoleSummary[] };
  permissions: PermissionKey[];
}

export interface ChangeAdminPasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
