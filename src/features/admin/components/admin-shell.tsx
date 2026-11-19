"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/config/routes";
import { getErrorMessage, hasAdminSessionEnded } from "@/lib/api";
import { cn } from "@/lib/utils/cn";
import { useAdminLogout, useCurrentAdmin } from "../hooks/use-admin-session";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

/**
 * The frame around every screen of the admin console: sidebar, top bar and
 * the page. It also keeps out staff who still have a generated password.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, error, refetch, isFetching } = useCurrentAdmin();
  const logout = useAdminLogout();

  const mustChangePassword = data?.admin.mustChangePassword === true;
  useEffect(() => {
    if (mustChangePassword) router.replace(ADMIN_ROUTES.changePassword);
  }, [mustChangePassword, router]);

  // Until we know who the staff member is and that they may be here, the
  // shell is kept invisible so the console never flashes for someone about
  // to be redirected. The page is still rendered underneath: Next.js
  // prerenders and prefetches it, so it must always be part of the tree.
  const ready = data !== undefined && !mustChangePassword;

  return (
    <>
      <div
        className={cn(
          "flex h-dvh w-full overflow-hidden bg-surface-subtle",
          !ready && "invisible",
        )}
      >
        <AdminSidebar className="hidden lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          {data ? <AdminTopbar admin={data.admin} /> : null}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[1168px] flex-col gap-6 p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* The profile could not be loaded (network or server trouble). Not
          shown when the session itself has ended (blocked, deleted, password
          reset): the browser is already on its way to the sign-in page, and
          an error screen would only flash. */}
      {error && !data && !hasAdminSessionEnded() ? (
        <div
          role="alert"
          className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-surface-subtle p-6 text-center"
        >
          <div className="flex max-w-sm flex-col gap-2">
            <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">
              The console could not load
            </h1>
            <p className="text-base text-muted-foreground">
              {getErrorMessage(error)}
            </p>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Button loading={isFetching} onClick={() => void refetch()}>
              Try Again
            </Button>
            <Button
              variant="outline"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
