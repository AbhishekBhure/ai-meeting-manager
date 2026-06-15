import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUnreadCount } from "@/actions/notifications"
import Sidebar from "@/components/layout/Sidebar"
import NotificationListener from "@/components/notifications/NotificationListener"
import { getUnreadMessageCount } from "@/actions/chat"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Protect all dashboard pages at the layout level
  if (!session) redirect("/login");

    // Fetch unread count server-side and pass as prop
  const unreadCount = await getUnreadCount();
  const unreadMessages = await getUnreadMessageCount(session.user.id);

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar user={session.user} unreadCount={unreadCount} unreadMessages={unreadMessages} />
           {/* 
        NotificationListener sits here invisibly.
        It connects to Pusher and listens for events.
        When a notification arrives, it calls router.refresh()
        which re-fetches the unread count and updates the bell.
      */}
      <NotificationListener userId={session.user.id} />
      
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}