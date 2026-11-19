"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { SidebarNavRow } from "@/components/layout/sidebar-nav-row";
import { ADMIN_NAV, type AdminNavItem } from "@/config/admin-navigation";
import { ADMIN_ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { usePermissions } from "../hooks/use-admin-session";

/** A section is current on its own page and on every page below it. */
function isCurrent(item: AdminNavItem, pathname: string): boolean {
  if (!item.href) return false;
  if (item.href === ADMIN_ROUTES.home) return pathname === ADMIN_ROUTES.home;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * The admin console's left navigation. It lists only the sections the
 * signed-in staff member has a permission for.
 */
export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const permissions = usePermissions();

  const items = ADMIN_NAV.filter(
    (item) => !item.anyOf || permissions.canAny(item.anyOf),
  );

  return (
    <aside
      className={cn(
        "w-[272px] shrink-0 flex-col border-r border-hairline bg-background",
        className,
      )}
    >
      <div className="flex border-b border-hairline p-6">
        <Link href={ADMIN_ROUTES.home} aria-label="Adviserz admin console">
          <Logo tone="dark" className="h-10" />
        </Link>
      </div>

      <nav
        aria-label="Admin console"
        className="flex flex-col overflow-y-auto p-6"
      >
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.label}>
              <SidebarNavRow
                label={item.label}
                icon={item.icon}
                href={item.href}
                active={isCurrent(item, pathname)}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
