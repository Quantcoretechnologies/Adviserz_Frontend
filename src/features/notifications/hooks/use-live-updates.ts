import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { authKeys } from "@/features/auth/api/auth.api";
import { riskKeys } from "@/features/risk/api/risk.api";
import { authSession } from "@/lib/auth/session";
import { connectUserSocket } from "@/lib/realtime/user-socket";
import { notificationKeys } from "../api/notifications.api";
import type { UnreadCount } from "../api/notifications.types";

/** A notification of this type means a risk notice now blocks the app. */
const RISK_NOTICE_REQUIRED = "risk_notice.required";

/**
 * Keep this tab up to date while it is open. Events only say that something
 * changed; the data is refetched over REST, which stays the source of truth.
 *
 * - New notification: refresh the bell. For a risk-limit change, also
 *   refresh the user, so the app moves to the risk notice right away.
 * - Read elsewhere: update the dot.
 * - Back online after a drop: refresh what may have been missed.
 * - Signed out elsewhere: leave for the sign-in page.
 */
export function useLiveUpdates(enabled: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const refreshBell = () =>
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    const refreshUser = () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      void queryClient.invalidateQueries({ queryKey: riskKeys.notice });
    };

    return connectUserSocket({
      onConnect: (isReconnect) => {
        // Anything that changed while this tab was not listening (e.g. the
        // alert cleared by accepting a risk notice on another page).
        refreshBell();
        if (isReconnect) refreshUser();
      },
      onNotification: (notification) => {
        refreshBell();
        if (notification.type === RISK_NOTICE_REQUIRED) refreshUser();
      },
      onRead: (unreadCount) => {
        queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, {
          unreadCount,
        });
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.list,
        });
      },
      onSessionEnded: () => {
        // Same as a session that can no longer be refreshed: forget it here
        // and go to the sign-in page.
        authSession.clear();
        queryClient.clear();
        window.location.assign(ROUTES.login);
      },
    });
  }, [enabled, queryClient]);
}
