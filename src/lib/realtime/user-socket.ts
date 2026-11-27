import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import { ErrorCode, refreshAccessToken } from "@/lib/api";
import { authSession } from "@/lib/auth/session";
import {
  USER_NAMESPACE,
  type NotificationPayload,
  type UserClientToServerEvents,
  type UserServerToClientEvents,
} from "./events";

type UserSocket = Socket<UserServerToClientEvents, UserClientToServerEvents>;

export interface UserSocketHandlers {
  /** Connected. `isReconnect` is true after a drop, when events may have been missed. */
  onConnect: (isReconnect: boolean) => void;
  onNotification: (notification: NotificationPayload) => void;
  /** Notifications were marked read, possibly on another device. */
  onRead: (unreadCount: number) => void;
  /** This session is over (signed out, blocked, password changed...). */
  onSessionEnded: () => void;
}

/** Refusals that a fresh access token fixes. */
const STALE_TOKEN_CODES: readonly string[] = [
  ErrorCode.ACCESS_TOKEN_EXPIRED,
  ErrorCode.ACCESS_TOKEN_INVALID,
];

/** Refusals that mean the session itself is over. */
const SESSION_ENDED_CODES: readonly string[] = [
  ErrorCode.SESSION_REVOKED,
  ErrorCode.SESSION_EXPIRED,
  ErrorCode.ACCOUNT_DISABLED,
];

const SERVER_ERROR_RETRY_MS = 10_000;

/** The API origin: NEXT_PUBLIC_API_URL without its path (e.g. /api/v1). */
function apiOrigin(): string {
  return new URL(env.NEXT_PUBLIC_API_URL).origin;
}

function refusalCode(error: Error): string | undefined {
  const data = (error as Error & { data?: { code?: unknown } }).data;
  return typeof data?.code === "string" ? data.code : undefined;
}

/**
 * Open this tab's connection to the customer real-time API and keep it
 * alive. Returns a function that closes it for good.
 *
 * - Every (re)connect sends the current access token, refreshing it first
 *   when the cookie is gone.
 * - Token expiry: the server says `auth:expired` and disconnects; the client
 *   reconnects at once, which refreshes the token.
 * - Network loss or a server restart: Socket.IO reconnects by itself.
 * - Sign-out anywhere (`session:revoked`, or a refused reconnect for the
 *   same reason): `onSessionEnded`, and no reconnect.
 */
export function connectUserSocket(handlers: UserSocketHandlers): () => void {
  let closed = false;
  let hasConnected = false;
  let retriedWithFreshToken = false;
  let tokenExpired = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const socket: UserSocket = io(`${apiOrigin()}${USER_NAMESPACE}`, {
    // WebSocket only: no long-polling fallback, so several API servers will
    // not need sticky sessions.
    transports: ["websocket"],
    autoConnect: false,
    // A function, so every reconnect sends the token in force at that moment.
    auth: (callback) => {
      const token = authSession.getAccessToken();
      if (token) {
        callback({ token });
        return;
      }
      refreshAccessToken().then(
        (fresh) => callback({ token: fresh }),
        // No session to restore; the API refuses and we stay offline.
        // Screens find out through their own requests.
        () => callback({ token: "" }),
      );
    },
  });

  const reconnect = () => {
    if (!closed) socket.connect();
  };

  socket.on("connect", () => {
    retriedWithFreshToken = false;
    handlers.onConnect(hasConnected);
    hasConnected = true;
  });

  socket.on("connect_error", (error) => {
    // Still `active`: a network problem, and Socket.IO is already retrying.
    if (closed || socket.active) return;

    // Otherwise the server refused the handshake.
    const code = refusalCode(error);
    if (code && STALE_TOKEN_CODES.includes(code) && !retriedWithFreshToken) {
      retriedWithFreshToken = true;
      refreshAccessToken().then(reconnect, () => {
        // The session cannot be restored; requests will send the person to
        // the sign-in page.
      });
      return;
    }
    if (code && SESSION_ENDED_CODES.includes(code)) {
      handlers.onSessionEnded();
      return;
    }
    if (code === ErrorCode.INTERNAL_ERROR) {
      retryTimer = setTimeout(reconnect, SERVER_ERROR_RETRY_MS);
    }
    // Anything else (e.g. too many open tabs): stay offline. The app keeps
    // working; it only stops updating live.
  });

  socket.on("notification:new", ({ notification }) =>
    handlers.onNotification(notification),
  );
  socket.on("notification:read", ({ unreadCount }) =>
    handlers.onRead(unreadCount),
  );
  socket.on("auth:expired", () => {
    tokenExpired = true;
  });
  socket.on("session:revoked", () => {
    closed = true;
    handlers.onSessionEnded();
  });

  socket.on("disconnect", (reason) => {
    // The server only ends a connection on purpose after `auth:expired` or
    // `session:revoked`. Other reasons reconnect by themselves.
    if (reason === "io server disconnect" && tokenExpired) {
      tokenExpired = false;
      reconnect();
    }
  });

  socket.connect();

  return () => {
    closed = true;
    clearTimeout(retryTimer);
    socket.removeAllListeners();
    socket.disconnect();
  };
}
