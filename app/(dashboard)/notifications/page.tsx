import { getNotifications, markAllAsRead } from "@/actions/notifications"
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton"

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
            <p className="text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border p-4 transition ${
                  notification.read
                    ? "border-gray-800 bg-gray-900/50"
                    : "border-blue-800/50 bg-blue-900/10"
                }`}
              >
                <p className="text-sm text-white">{notification.message}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}