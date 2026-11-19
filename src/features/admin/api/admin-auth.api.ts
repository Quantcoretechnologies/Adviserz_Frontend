import { adminAuthedApi, api } from "@/lib/api";
import type {
  AdminLoginRequest,
  AdminSignedInResponse,
  ChangeAdminPasswordRequest,
  CurrentAdminResponse,
} from "./admin-auth.types";

/**
 * Raw calls to the admin auth endpoints. Components never call these
 * directly; they go through the TanStack Query hooks in ../hooks.
 */
export const adminAuthApi = {
  login: (body: AdminLoginRequest) =>
    api.post<AdminSignedInResponse>("/admin/auth/login", body),

  logout: (csrfToken: string) =>
    api.post<null>("/admin/auth/logout", undefined, { csrfToken }),

  currentAdmin: () =>
    adminAuthedApi.get<CurrentAdminResponse>("/admin/auth/me"),

  changePassword: (body: ChangeAdminPasswordRequest) =>
    adminAuthedApi.post<{ revokedSessions: number }>(
      "/admin/auth/change-password",
      body,
    ),
};

/** Every admin query key starts with "admin", so sign-out can drop them all. */
export const adminKeys = {
  all: ["admin"] as const,
  currentAdmin: ["admin", "current-admin"] as const,
};
