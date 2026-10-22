
import apiClient from '../../services/api/axios'

export type NotificationType =
  | 'ORDER'
  | 'PRODUCT'
  | 'USER'
  | 'REVIEW'
  | 'SYSTEM'
  | string

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export interface NotificationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface NotificationsResponse {
  notifications: Notification[]
  pagination: NotificationPagination
  unreadCount: number
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface NotificationListApiResponse {
  success: boolean
  message: string
  data: Notification[]
  pagination: NotificationPagination
  unreadCount: number
}

export async function getNotifications(params?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}): Promise<NotificationsResponse> {
  const response = await apiClient.get<NotificationListApiResponse>(
    '/user/notifications',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.unreadOnly !== undefined
          ? { unreadOnly: params.unreadOnly }
          : {}),
      },
    },
  )

  return {
    notifications: response.data.data,
    pagination: response.data.pagination,
    unreadCount: response.data.unreadCount,
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiClient.get<
    ApiResponse<{ unreadCount: number }>
  >('/user/notifications/unread-count')

  return response.data.data.unreadCount
}

export async function markNotificationAsRead(
  id: string,
): Promise<Notification> {
  const response = await apiClient.patch<ApiResponse<Notification>>(
    `/user/notifications/${encodeURIComponent(id)}/read`,
  )

  return response.data.data
}

export async function markAllNotificationsAsRead(): Promise<{
  updatedCount: number
}> {
  const response = await apiClient.patch<
    ApiResponse<{ updatedCount: number }>
  >('/user/notifications/read-all')

  return response.data.data
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(
    `/user/notifications/${encodeURIComponent(id)}`,
  )
}
