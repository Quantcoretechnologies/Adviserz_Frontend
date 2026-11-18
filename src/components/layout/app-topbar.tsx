"use client";

import Image from "next/image";
import { useState } from "react";
import type { AuthUser } from "@/features/auth/api/auth.types";
import { useLogout } from "@/features/auth/hooks/use-session";
import { formatIndianPhone } from "@/lib/utils/format";

/** The line under the user's name: their email, or phone if no email yet. */
function contactLine(user: AuthUser): string {
  if (user.email) return user.email;
  return user.phone ? formatIndianPhone(user.phone.replace(/^\+91/, "")) : "";
}

/** The app's top bar: notifications and the signed-in user. */
export function AppTopbar({ user }: { user: AuthUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = useLogout();

  return (
    <header className="flex w-full items-center justify-end gap-6 border-b border-hairline bg-background px-6 py-5">
      <button
        type="button"
        aria-label="Notifications"
        className="cursor-pointer rounded-xl p-2.5"
      >
        <Image src="/icons/app/bell.svg" alt="" width={24} height={24} />
      </button>

      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex cursor-pointer items-center gap-3 text-left"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface">
            <Image src="/icons/app/user.svg" alt="" width={24} height={24} />
          </span>
          <span className="flex flex-col gap-[3px] font-semibold">
            <span className="font-display text-base text-foreground">
              {user.fullName}
            </span>
            <span className="text-sm tracking-[-0.21px] text-subtle">
              {contactLine(user)}
            </span>
          </span>
        </button>

        {menuOpen ? (
          <>
            {/* Click-away layer: closes the menu when anything else is clicked. */}
            <div
              aria-hidden
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              className="absolute top-full right-0 z-20 mt-2 min-w-40 rounded-xl border border-hairline bg-background p-2 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
                className="w-full cursor-pointer rounded-lg px-3 py-2 text-left font-display text-base text-foreground hover:bg-surface disabled:opacity-60"
              >
                Log out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
