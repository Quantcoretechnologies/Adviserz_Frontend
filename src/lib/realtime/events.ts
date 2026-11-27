/**
 * The customer real-time contract, mirrored from the API
 * (adviserz_be/src/modules/realtime/realtime.events.ts and docs/realtime.md).
 * Keep the two in step.
 */

/** Customers connect to this namespace on the API origin. */
export const USER_NAMESPACE = "/user";

/** The notification shape, the same over REST and over the socket. */
export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  /** A path in this app, e.g. "/risk-notice", or null. */
  link: string | null;
  data: Record<string, unknown> | null;
  /** ISO timestamp, or null while unread. */
  readAt: string | null;
  /** ISO timestamp. */
  createdAt: string;
}

/** Events the server sends. Clients send none. */
export interface UserServerToClientEvents {
  "notification:new": (payload: { notification: NotificationPayload }) => void;
  "notification:read": (payload: { unreadCount: number }) => void;
  /** The token this connection was opened with has expired; the server disconnects right after. */
  "auth:expired": () => void;
  /** This session was signed out; the server disconnects right after. Do not reconnect. */
  "session:revoked": (payload: { reason: string }) => void;
}

export type UserClientToServerEvents = Record<string, never>;
