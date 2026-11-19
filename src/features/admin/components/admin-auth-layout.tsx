import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

/**
 * The frame around the admin console's sign-in and password screens: one
 * centred card, with no marketing panel (this is a staff tool).
 */
export function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-surface-subtle p-6">
      <main className="flex w-full max-w-[561px] flex-col gap-8 rounded-3xl border border-hairline bg-background p-8 sm:p-12">
        <div className="flex items-center justify-between gap-4">
          <Logo tone="dark" className="h-10" />
          <span className="rounded-md bg-brand-gradient-badge px-2 py-1 text-sm leading-none font-semibold text-primary">
            Admin console
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
