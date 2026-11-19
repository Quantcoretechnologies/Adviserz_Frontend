"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/layout/user-menu";
import { MaskIcon } from "@/components/ui/mask-icon";
import { ADMIN_ROUTES } from "@/config/routes";
import type { CurrentAdminResponse } from "../api/admin-auth.types";
import { useAdminLogout } from "../hooks/use-admin-session";
import { AdminSidebar } from "./admin-sidebar";

/** The line under the name: what this person is in the console. */
function roleLine(admin: CurrentAdminResponse["admin"]): string {
  if (admin.isSuperAdmin) return "Super admin";
  if (admin.roles.length === 0) return admin.email;
  return admin.roles.map((role) => role.name).join(", ");
}

/**
 * The admin console's top bar: the signed-in staff member and their account
 * menu. On screens too narrow for the sidebar (tablets held upright) it also
 * carries a menu button that slides the navigation in.
 */
export function AdminTopbar({
  admin,
}: {
  admin: CurrentAdminResponse["admin"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAdminLogout();
  // The panel remembers the page it was opened on, so choosing a section
  // (which changes the page) closes it without any extra bookkeeping.
  const [navOpenedOn, setNavOpenedOn] = useState<string | null>(null);
  const navOpen = navOpenedOn === pathname;
  const setNavOpen = (open: boolean) => setNavOpenedOn(open ? pathname : null);

  // Escape closes the panel, as it does for every other overlay.
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpenedOn(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return (
    <header className="flex w-full items-center justify-between gap-6 border-b border-hairline bg-background px-6 py-5 lg:justify-end">
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={navOpen}
        aria-controls="admin-mobile-nav"
        onClick={() => setNavOpen(true)}
        className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-foreground lg:hidden"
      >
        <MaskIcon src="/icons/admin/menu.svg" />
      </button>

      <UserMenu
        name={admin.fullName}
        subtitle={roleLine(admin)}
        items={[
          {
            label: "Change password",
            onSelect: () => router.push(ADMIN_ROUTES.changePassword),
          },
          {
            label: "Log out",
            onSelect: () => logout.mutate(),
            disabled: logout.isPending,
          },
        ]}
      />

      {navOpen ? (
        <div
          id="admin-mobile-nav"
          className="fixed inset-0 z-40 flex lg:hidden"
        >
          <AdminSidebar className="flex h-full shadow-xl" />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="flex-1 cursor-default bg-black/40"
          />
        </div>
      ) : null}
    </header>
  );
}
