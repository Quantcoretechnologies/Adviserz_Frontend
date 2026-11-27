"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import type { AppNotification } from "../api/notifications.types";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useNotificationList,
} from "../hooks/use-notifications";

/** Only paths inside this app are followed. */
function isAppPath(link: string | null): link is string {
  return link !== null && link.startsWith("/") && !link.startsWith("//");
}

interface NotificationPanelProps {
  unreadCount: number;
  onClose: () => void;
}

/** The list under the bell. Wording and layout are ours: Figma has no panel. */
export function NotificationPanel({
  unreadCount,
  onClose,
}: NotificationPanelProps) {
  const router = useRouter();
  const list = useNotificationList(true);
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  const open = (notification: AppNotification) => {
    if (!notification.readAt) markRead.mutate([notification.id]);
    if (isAppPath(notification.link)) {
      onClose();
      router.push(notification.link as Route);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute top-full right-0 z-20 mt-2 flex max-h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-xl border border-hairline bg-background shadow-lg"
    >
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Notifications
        </h2>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="cursor-pointer text-sm font-semibold text-primary hover:underline disabled:opacity-60"
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.isPending ? (
          <p className="px-4 py-6 text-sm text-subtle">Loading…</p>
        ) : list.isError ? (
          <div className="flex flex-col items-start gap-2 px-4 py-6">
            <p className="text-sm text-subtle">
              Your notifications could not be loaded.
            </p>
            <button
              type="button"
              onClick={() => void list.refetch()}
              className="cursor-pointer text-sm font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-subtle">
            You have no notifications yet.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {items.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => open(notification)}
                  className="flex w-full cursor-pointer gap-3 px-4 py-3 text-left hover:bg-surface"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-2 size-2 shrink-0 rounded-full",
                      notification.readAt ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span
                      className={cn(
                        "text-sm text-foreground",
                        notification.readAt ? "font-normal" : "font-semibold",
                      )}
                    >
                      {notification.title}
                      {notification.readAt ? null : (
                        <span className="sr-only"> (unread)</span>
                      )}
                    </span>
                    <span className="text-sm text-subtle">
                      {notification.body}
                    </span>
                    <time
                      dateTime={notification.createdAt}
                      className="text-xs text-quiet"
                    >
                      {formatDateTime(notification.createdAt)}
                    </time>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {list.hasNextPage ? (
          <div className="border-t border-hairline px-4 py-3">
            <button
              type="button"
              onClick={() => void list.fetchNextPage()}
              disabled={list.isFetchingNextPage}
              className="cursor-pointer text-sm font-semibold text-primary hover:underline disabled:opacity-60"
            >
              {list.isFetchingNextPage ? "Loading…" : "Show older"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
