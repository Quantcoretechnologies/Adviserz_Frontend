"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useUnreadCount } from "../hooks/use-notifications";
import { NotificationPanel } from "./notification-panel";

/**
 * The bell in the top bar. A red dot shows there is something unread (as in
 * the design: a dot, no number); clicking opens the list.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useUnreadCount();
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative cursor-pointer rounded-xl p-2.5"
      >
        <Image src="/icons/app/bell.svg" alt="" width={24} height={24} />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute top-[11px] right-[13px] size-2 rounded-full bg-negative"
          />
        ) : null}
      </button>

      {open ? (
        <>
          {/* Click-away layer: closes the panel when anything else is clicked. */}
          <div
            aria-hidden
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <NotificationPanel
            unreadCount={unread}
            onClose={() => setOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}
