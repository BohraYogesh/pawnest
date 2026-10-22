
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications.api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, unreadOnly: boolean) =>
    ['notifications', 'list', page, unreadOnly] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

export function useNotifications(
  page = 1,
  unreadOnly = false,
) {
  return useQuery({
    queryKey: notificationKeys.list(page, unreadOnly),
    queryFn: () =>
      getNotifications({ page, limit: 10, unreadOnly }),
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount,
        }),
      ])
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount,
        }),
      ])
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount,
        }),
      ])
    },
  })
}
