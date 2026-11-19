"use client";

import Image from "next/image";
import { useState } from "react";

export interface UserMenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface UserMenuProps {
  name: string;
  /** The line under the name: an email, a phone number or a role. */
  subtitle: string;
  items: UserMenuItem[];
}

/** The signed-in person in a top bar, with a small menu of account actions. */
export function UserMenu({ name, subtitle, items }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex cursor-pointer items-center gap-3 text-left"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface">
          <Image src="/icons/app/user.svg" alt="" width={24} height={24} />
        </span>
        <span className="flex flex-col gap-[3px] font-semibold">
          <span className="font-display text-base text-foreground">{name}</span>
          <span className="text-sm tracking-[-0.21px] text-subtle">
            {subtitle}
          </span>
        </span>
      </button>

      {open ? (
        <>
          {/* Click-away layer: closes the menu when anything else is clicked. */}
          <div
            aria-hidden
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-full right-0 z-20 mt-2 min-w-40 rounded-xl border border-hairline bg-background p-2 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className="w-full cursor-pointer rounded-lg px-3 py-2 text-left font-display text-base whitespace-nowrap text-foreground hover:bg-surface disabled:opacity-60"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
