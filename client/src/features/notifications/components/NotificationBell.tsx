import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  LoaderCircle,
  Package,
  Star,
  Trash2,
  UserRound,
  Info,
} from "lucide-react";
import NotificationItem from "./NotificationItem";

import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "../notifications.queries";

function getIcon(type: string) {
  switch (type.toUpperCase()) {
    case "ORDER":
    case "PRODUCT":
      return Package;
    case "USER":
      return UserRound;
    case "REVIEW":
      return Star;
    default:
      return Info;
  }
}

function getIconStyle(type: string) {
  switch (type.toUpperCase()) {
    case "ORDER":
      return "bg-orange-50 text-orange-600";
    case "PRODUCT":
      return "bg-rose-50 text-rose-600";
    case "REVIEW":
      return "bg-amber-50 text-amber-600";
    case "USER":
      return "bg-blue-50 text-blue-600";
    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

function formatTime(date: string) {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

type NotificationBellProps = {
  onUnreadCountChange?: (count: number) => void;
};

export default function NotificationBell({
  onUnreadCountChange,
}: NotificationBellProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notificationsQuery = useNotifications(1, filter === "unread");
  const markReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleMarkRead(id: string) {
    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      toast.error("Could not mark notification as read");
    }
  }

  async function handleMarkAllRead() {
    try {
      const result = await markAllMutation.mutateAsync();
      toast.success(`${result.updatedCount} notification(s) marked as read`);
    } catch {
      toast.error("Could not mark notifications as read");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Notification deleted");
    } catch {
      toast.error("Could not delete notification");
    }
  }

  function viewAll() {
    setOpen(false);
    navigate("/notifications");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`relative rounded-xl p-2.5 transition ${
          open
            ? "bg-[#49866E]/10 text-[#295F4C]"
            : "text-slate-600 hover:bg-[#49866E]/10 hover:text-[#295F4C]"
        }`}
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+14px)] z-50 w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] sm:w-[440px]">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Notifications
              </h2>

              {unreadCount > 0 && (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                  {unreadCount} new
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markAllMutation.isPending}
              className="shrink-0 text-xs font-semibold text-[#295F4C] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              {markAllMutation.isPending
                ? "Please wait..."
                : "Mark all as read"}
            </button>
          </div>

          <div className="mx-5 flex gap-5 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`relative pb-3 text-sm font-semibold ${
                filter === "all"
                  ? "text-[#295F4C]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
              {filter === "all" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#295F4C]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`relative pb-3 text-sm font-semibold ${
                filter === "unread"
                  ? "text-[#295F4C]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Unread ({unreadCount})
              {filter === "unread" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#295F4C]" />
              )}
            </button>
          </div>

          <div className="max-h-[min(480px,60vh)] overflow-y-auto p-3">
            {notificationsQuery.isPending ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
                <LoaderCircle size={20} className="animate-spin" />
                Loading notifications...
              </div>
            ) : notificationsQuery.isError ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  Couldn't load notifications
                </p>
                <button
                  type="button"
                  onClick={() => notificationsQuery.refetch()}
                  className="mt-2 text-sm font-semibold text-[#295F4C] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#49866E]/10 text-[#295F4C]">
                  <Bell size={23} />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "No notifications yet"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  New notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                    isMarkingRead={markReadMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={viewAll}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-4 text-sm font-bold text-[#295F4C] transition hover:bg-[#49866E]/5"
          >
            View all notifications
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
