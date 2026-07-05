import { BellIcon, CheckIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { notificationService } from "../../services/notificationService";

const formatTime = (value: string) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

const NotificationsMenu = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationService.list,
    staleTime: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
      >
        <BellIcon size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-950">Notifications</p>
              <p className="text-xs text-slate-500">Live operational updates</p>
            </div>
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <CheckIcon size={13} /> Read all
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {notificationsQuery.isLoading && <div className="p-4 text-sm text-slate-500">Loading notifications…</div>}
            {!notificationsQuery.isLoading && notifications.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-slate-900">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-500">Important appointment and profile events will appear here.</p>
              </div>
            )}
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => !notification.readAt && markReadMutation.mutate(notification.id)}
                className="mb-1 w-full rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
              >
                <div className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.readAt ? "bg-slate-200" : notification.priority === "HIGH" ? "bg-rose-500" : "bg-blue-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatTime(notification.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
