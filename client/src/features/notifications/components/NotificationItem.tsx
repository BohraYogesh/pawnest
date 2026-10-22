
import {
  Bell,
  Check,
  Info,
  Package,
  Star,
  Trash2,
  UserRound,
} from 'lucide-react'

import type { Notification } from '../notifications.api'

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  isMarkingRead?: boolean
  isDeleting?: boolean
}

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

function getIconStyle(type: string) {
  switch (type.toUpperCase()) {
    case 'ORDER':
      return 'bg-orange-50 text-orange-600'
    case 'PRODUCT':
      return 'bg-rose-50 text-rose-600'
    case 'REVIEW':
      return 'bg-amber-50 text-amber-600'
    case 'USER':
      return 'bg-blue-50 text-blue-600'
    default:
      return 'bg-emerald-50 text-emerald-700'
  }
}

function formatTime(date: string) {
  const timestamp = new Date(date).getTime()

  if (Number.isNaN(timestamp)) return ''

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000),
  )

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)

  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isMarkingRead = false,
  isDeleting = false,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type)
  const unread = !notification.readAt

  return (
    <div
      className={`group flex gap-3 rounded-xl p-3 transition ${
        unread ? 'bg-[#F0F8F4]' : 'hover:bg-slate-50'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getIconStyle(notification.type)}`}
      >
        <Icon size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`break-words text-[13px] leading-5 ${
              unread
                ? 'font-bold text-slate-900'
                : 'font-semibold text-slate-700'
            }`}
          >
            {notification.title}
          </p>

          <span className="shrink-0 pt-0.5 text-[10px] text-slate-400">
            {formatTime(notification.createdAt)}
          </span>
        </div>

        <p className="mt-0.5 break-words text-xs leading-5 text-slate-500">
          {notification.body}
        </p>

        <div className="mt-2 flex items-center justify-between">
          {unread ? (
            <span className="text-[10px] font-semibold text-[#295F4C]">
              Unread
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100">
            {unread && (
              <button
                type="button"
                title="Mark as read"
                aria-label="Mark as read"
                disabled={isMarkingRead}
                onClick={() => onMarkRead(notification.id)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-[#295F4C] disabled:opacity-50"
              >
                <Check size={15} />
              </button>
            )}

            <button
              type="button"
              title="Delete notification"
              aria-label="Delete notification"
              disabled={isDeleting}
              onClick={() => onDelete(notification.id)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {unread && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  )
}
