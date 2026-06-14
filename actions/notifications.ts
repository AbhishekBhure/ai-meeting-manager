"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
export async function getUnreadCount() {
  const session = await auth()
  if (!session?.user?.id) return 0

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  })

  return count
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