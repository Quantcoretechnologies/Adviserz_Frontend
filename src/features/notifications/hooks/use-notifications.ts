import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/api";
import { notificationKeys, notificationsApi } from "../api/notifications.api";
import type {
  MarkReadResult,
  NotificationPage,
  UnreadCount,
} from "../api/notifications.types";

const PAGE_SIZE = 20;

/**
 * The number of unread notifications, for the dot on the bell. Kept fresh by
 * the live connection (see useLiveUpdates), so it is never polled.
 */
export function useUnreadCount() {
  return useQuery<UnreadCount, ApiError>({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationsApi.unreadCount,
    staleTime: Infinity,
  });
}

/** The bell's list, newest first, a page at a time. Loaded when opened. */
export function useNotificationList(enabled: boolean) {
  return useInfiniteQuery<NotificationPage, ApiError>({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) =>
      notificationsApi.list(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.page < pagination.totalPages ? pagination.page + 1 : undefined,
    enabled,
    staleTime: 0,
  });
}

function useAfterMarkingRead() {
  const queryClient = useQueryClient();
  return ({ unreadCount }: MarkReadResult) => {
    queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, {
      unreadCount,
    });
    void queryClient.invalidateQueries({ queryKey: notificationKeys.list });
  };
}

export function useMarkNotificationsRead() {
  const onSuccess = useAfterMarkingRead();
  return useMutation<MarkReadResult, ApiError, string[]>({
    mutationFn: notificationsApi.markRead,
    onSuccess,
  });
}

export function useMarkAllNotificationsRead() {
  const onSuccess = useAfterMarkingRead();
  return useMutation<MarkReadResult, ApiError, void>({
    mutationFn: notificationsApi.markAllRead,
    onSuccess,
  });
}
