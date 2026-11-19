"use client";

import Image from "next/image";
import type { AuthUser } from "@/features/auth/api/auth.types";
import { useLogout } from "@/features/auth/hooks/use-session";
import { formatIndianPhone } from "@/lib/utils/format";
import { UserMenu } from "./user-menu";

/** The line under the user's name: their email, or phone if no email yet. */
function contactLine(user: AuthUser): string {
  if (user.email) return user.email;
  return user.phone ? formatIndianPhone(user.phone.replace(/^\+91/, "")) : "";
}

/** The app's top bar: notifications and the signed-in user. */
export function AppTopbar({ user }: { user: AuthUser }) {
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

      <UserMenu
        name={user.fullName}
        subtitle={contactLine(user)}
        items={[
          {
            label: "Log out",
            onSelect: () => logout.mutate(),
            disabled: logout.isPending,
          },
        ]}
      />
    </header>
  );
}
