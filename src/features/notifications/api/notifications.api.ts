import { authedApi } from "@/lib/api";
import type {
  MarkReadResult,
  NotificationPage,
  UnreadCount,
} from "./notifications.types";

/** Raw calls to the bell endpoints. Components use the hooks in ../hooks. */
export const notificationsApi = {
  /** Newest first. */
  list: (page: number, pageSize: number) =>
    authedApi.get<NotificationPage>(
      `/users/me/notifications?page=${page}&pageSize=${pageSize}`,
    ),

  unreadCount: () =>
    authedApi.get<UnreadCount>("/users/me/notifications/unread-count"),

  /** Ids that are unknown or already read are ignored. */
  markRead: (ids: string[]) =>
    authedApi.post<MarkReadResult>("/users/me/notifications/read", { ids }),

  markAllRead: () =>
    authedApi.post<MarkReadResult>("/users/me/notifications/read-all"),
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};
