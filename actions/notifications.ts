"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { pusherServer } from "@/lib/pusher-server"

// GET ALL NOTIFICATIONS for current user
export async function getNotifications() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20, // limit to 20 most recent
  })

  return notifications
}

// GET UNREAD COUNT — used for the bell badge
// export async function getUnreadCount(): Promise<number> {
//   const session = await auth()
//   if (!session?.user?.id) return 0

//   const count = await prisma.notification.count({
//     where: {
//       userId: session.user.id,
//       read: false,
//     },
//   })

//   return count
// }

export async function getUnreadCount(): Promise<number> {
  try {
    const session = await auth()
    if (!session?.user?.id) return 0

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    })

    return count
  } catch {
    // If anything fails, return 0 instead of crashing the layout
    return 0
  }
}

// MARK ALL AS READ
export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    data: { read: true },
  })

  revalidatePath("/notifications")
}

// MARK ONE AS READ
export async function markAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })

  revalidatePath("/notifications")
}

// Helper — trigger a real-time notification event
// channelName: unique per user so only they receive their notifications
// We use user's ID to make the channel private to them
export async function triggerNotification(userId: string, message: string) {
  await pusherServer.trigger(
    `user-${userId}`,     // channel name — unique per user
    "new-notification",   // event name — what we listen for on client
    { message }           // data — what we send
  )
}