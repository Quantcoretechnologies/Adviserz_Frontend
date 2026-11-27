import type { NotificationPayload } from "@/lib/realtime/events";

/** A notification in the bell. Same shape over REST and the socket. */
export type AppNotification = NotificationPayload;

export interface NotificationPage {
  items: AppNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCount {
  unreadCount: number;
}

export interface MarkReadResult {
  updated: number;
  unreadCount: number;
}
