
import { useState } from 'react'
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  LoaderCircle,
  Package,
  RefreshCw,
  Trash2,
  UserRound,
  Star,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from './notifications.queries'

type FilterType = 'all' | 'unread'

function getNotificationIcon(type: string) {
  switch (type.toUpperCase()) {
    case 'ORDER':
    case 'PRODUCT':
      return Package
    case 'USER':
      return UserRound
    case 'REVIEW':
      return Star
    default:
      return Bell
  }
}

function formatNotificationDate(date: string) {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)

  const unreadOnly = filter === 'unread'

  const notificationsQuery = useNotifications(page, unreadOnly)
  const markReadMutation = useMarkNotificationAsRead()
  const markAllMutation = useMarkAllNotificationsAsRead()
  const deleteMutation = useDeleteNotification()

  const notifications = notificationsQuery.data?.notifications ?? []
  const pagination = notificationsQuery.data?.pagination
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0

  function changeFilter(nextFilter: FilterType) {
    setFilter(nextFilter)
    setPage(1)
  }

  async function handleMarkRead(id: string) {
    try {
      await markReadMutation.mutateAsync(id)
      toast.success('Notification marked as read')
    } catch {
      toast.error('Could not mark notification as read')
    }
  }

  async function handleMarkAllRead() {
    try {
      const result = await markAllMutation.mutateAsync()
      toast.success(`${result.updatedCount} notification(s) marked as read`)

      if (filter === 'unread') setPage(1)
    } catch {
      toast.error('Could not mark notifications as read')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Notification deleted')
    } catch {
      toast.error('Could not delete notification')
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#49866E]/10 text-[#295F4C]">
              <Bell size={24} />
            </span>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Stay updated with your latest notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => notificationsQuery.refetch()}
            disabled={notificationsQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={notificationsQuery.isFetching ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markAllMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#295F4C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214D3E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markAllMutation.isPending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <CheckCheck size={16} />
            )}
            Mark all as read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total notifications
              </p>
              <p className="mt-2 text-3xl text-slate-900">
                {pagination?.total ?? '—'}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#49866E]/10 text-[#295F4C]">
              <Bell size={23} />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Unread notifications
              </p>
              <p className="mt-2 text-3xl text-slate-900">
                {unreadCount}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#E98A35]">
              <Info size={23} />
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Recent activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Notifications for your signed-in account
            </p>
          </div>

          <div className="flex w-fit rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => changeFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === 'all'
                  ? 'bg-white text-[#295F4C] '
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => changeFilter('unread')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === 'unread'
                  ? 'bg-white text-[#295F4C]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {notificationsQuery.isPending ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={30} className="animate-spin text-[#49866E]" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : notificationsQuery.isError ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <p className="font-semibold text-slate-800">
              Could not load notifications
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => notificationsQuery.refetch()}
              className="mt-4 rounded-xl bg-[#295F4C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#214D3E]"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#49866E]/10 text-[#49866E]">
              <Bell size={30} />
            </span>
            <h3 className="mt-4 font-bold text-slate-900">
              {filter === 'unread'
                ? 'You’re all caught up!'
                : 'No notifications yet'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {filter === 'unread'
                ? 'You have no unread notifications right now.'
                : 'New notifications will appear here when they are created for your account.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const isUnread = !notification.readAt

              return (
                <article
                  key={notification.id}
                  className={`flex gap-3 px-4 py-5 transition hover:bg-slate-50/80 sm:gap-4 sm:px-6 ${
                    isUnread ? 'bg-[#49866E]/[0.035]' : ''
                  }`}
                >
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#49866E]/10 text-[#295F4C]">
                    <Icon size={21} />
                    {isUnread && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#E98A35]" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm ${
                          isUnread
                            ? 'font-bold text-slate-900'
                            : 'font-semibold text-slate-700'
                        }`}
                      >
                        {notification.title}
                      </h3>

                      {isUnread && (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {notification.body}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatNotificationDate(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    {isUnread && (
                      <button
                        type="button"
                        title="Mark as read"
                        aria-label={`Mark ${notification.title} as read`}
                        disabled={markReadMutation.isPending}
                        onClick={() => handleMarkRead(notification.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-[#49866E]/10 hover:text-[#295F4C] disabled:opacity-50"
                      >
                        <CircleCheck size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Delete notification"
                      aria-label={`Delete ${notification.title}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(notification.id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || notificationsQuery.isFetching}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= pagination.totalPages ||
                  notificationsQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
