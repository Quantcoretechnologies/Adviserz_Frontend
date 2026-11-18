"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import {
  PLACEHOLDER_BROKERS,
  PLACEHOLDER_NEW_ADVISORIES,
  PLACEHOLDER_RECENT_SEARCHES,
} from "@/data/placeholder";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { cn } from "@/lib/utils/cn";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

/**
 * The frame around every screen of the signed-in app: sidebar, top bar and
 * the page. It also keeps out users who have not finished onboarding.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data } = useCurrentUser();

  const mustOnboard = data?.requirements.onboardingRequired === true;
  useEffect(() => {
    if (mustOnboard) router.replace(ROUTES.onboarding);
  }, [mustOnboard, router]);

  // Until we know who the user is and that they may be here, the shell is
  // kept invisible so the app never flashes for someone about to be
  // redirected. The page is still rendered underneath: Next.js prerenders
  // and prefetches it, so it must always be part of the tree.
  const ready = data !== undefined && !mustOnboard;

  return (
    <div
      className={cn(
        "flex h-dvh w-full overflow-hidden bg-surface-subtle",
        !ready && "invisible",
      )}
    >
      <AppSidebar
        className="hidden lg:flex"
        brokers={PLACEHOLDER_BROKERS}
        recentSearches={PLACEHOLDER_RECENT_SEARCHES}
        badges={{ newAdvisories: PLACEHOLDER_NEW_ADVISORIES }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {data ? <AppTopbar user={data.user} /> : null}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
