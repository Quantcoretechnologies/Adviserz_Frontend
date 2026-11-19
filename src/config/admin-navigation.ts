import type { Route } from "next";
import { ADMIN_ROUTES } from "./routes";

export interface AdminNavItem {
  label: string;
  /** SVG in /public, drawn in the item's text colour. */
  icon: string;
  /** Absent while the destination screen has not been built. */
  href?: Route;
  /**
   * The item is shown when the staff member holds at least one of these
   * permissions. Absent means every signed-in staff member sees it.
   */
  anyOf?: readonly string[];
}

/**
 * The admin console's sidebar, in display order. Each section names the
 * permission that opens it, so a staff member only sees what their roles
 * allow. Add a section here when its screen and permissions exist.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: "Dashboard",
    icon: "/icons/app/dashboard.svg",
    href: ADMIN_ROUTES.home,
  },
  {
    label: "Customers",
    icon: "/icons/admin/customers.svg",
    anyOf: ["users.view"],
  },
  {
    label: "Staff",
    icon: "/icons/admin/staff.svg",
    href: ADMIN_ROUTES.staff,
    anyOf: ["staff.view"],
  },
  {
    label: "Roles",
    icon: "/icons/admin/roles.svg",
    href: ADMIN_ROUTES.roles,
    anyOf: ["roles.view"],
  },
  {
    label: "Segments",
    icon: "/icons/admin/segments.svg",
    anyOf: ["segments.view"],
  },
  {
    label: "Policies",
    icon: "/icons/admin/policies.svg",
    anyOf: ["policies.view"],
  },
  {
    label: "Audit Logs",
    icon: "/icons/admin/audit.svg",
    anyOf: ["audit_logs.view"],
  },
];
