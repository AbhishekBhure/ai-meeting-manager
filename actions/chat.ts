"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher-server"
import { revalidatePath } from "next/cache"

// SEND GROUP MESSAGE
export async function sendGroupMessage(teamId: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify user is a member of this team
  const membership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      teamId,
    },
  })

  if (!membership) throw new Error("You are not a member of this team")

  // Check chat permission
  if (!membership.canChat) {
    throw new Error("You don't have permission to send messages")
  }

  // Save message to DB
  const message = await prisma.message.create({
    data: {
      content,
      type: "GROUP",
      senderId: session.user.id,
      teamId,
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
  })

  // Trigger real-time event to all team members
  await pusherServer.trigger(
    `team-${teamId}`,       // channel — one per team
    "new-group-message",    // event
    {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: message.sender,
    }
  );

  // Notify all team members except sender
const teamMembers = await prisma.teamMember.findMany({
  where: {
    teamId,
    userId: { not: session.user.id },
  },
  select: { userId: true },
})

// Save notifications to DB
await prisma.notification.createMany({
  data: teamMembers.map((m) => ({
    userId: m.userId,
    message: `${session.user.name} sent a message in team chat`,
  })),
})

// Push real-time notification to each member
for (const m of teamMembers) {
  await pusherServer.trigger(
    `user-${m.userId}`,
    "new-notification",
    { message: `${session.user.name} sent a message in team chat` }
  )
}

  return message
}

// SEND DIRECT MESSAGE
export async function sendDirectMessage(
  receiverId: string,
  teamId: string,
  content: string
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify sender is a team member
  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, teamId },
  })

  if (!membership) throw new Error("You are not a member of this team")
  if (!membership.canChat) {
    throw new Error("You don't have permission to send messages")
  }

  // Save DM to DB
  const message = await prisma.message.create({
    data: {
      content,
      type: "DIRECT",
      senderId: session.user.id,
      receiverId,
      teamId,
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
  })

  // DM channel is unique between two users
  // Sort IDs so the channel name is the same regardless of who sends
  const dmChannel = `dm-${[session.user.id, receiverId].sort().join("-")}`

  await pusherServer.trigger(dmChannel, "new-dm", {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    sender: message.sender,
  });

  // Notify the receiver
await prisma.notification.create({
  data: {
    userId: receiverId,
    message: `${session.user.name} sent you a direct message`,
  },
})

await pusherServer.trigger(
  `user-${receiverId}`,
  "new-notification",
  { message: `${session.user.name} sent you a direct message` }
);

// After creating the notification, add this separate trigger
await pusherServer.trigger(
  `user-${receiverId}`,
  "new-dm-notification",  
  { message: `${session.user.name} sent you a direct message` }
)

  return message
}

// GET GROUP MESSAGES
export async function getGroupMessages(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify membership
  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, teamId },
  })

  if (!membership) throw new Error("Not a team member")

  const messages = await prisma.message.findMany({
    where: {
      teamId,
      type: "GROUP",
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50, // last 50 messages
  })

  return messages
}

// GET DIRECT MESSAGES between two users
export async function getDirectMessages(
  otherUserId: string,
  teamId: string
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const messages = await prisma.message.findMany({
    where: {
      teamId,
      type: "DIRECT",
      OR: [
        // Messages I sent to them
        { senderId: session.user.id, receiverId: otherUserId },
        // Messages they sent to me
        { senderId: otherUserId, receiverId: session.user.id },
      ],
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  return messages
}

// GET UNREAD MESSAGE COUNT
export async function getUnreadMessageCount(userId: string) {
  try {
    // Count notifications related to chat messages
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
        OR: [
          { message: { contains: "sent a message in team chat" } },
          { message: { contains: "sent you a direct message" } },
        ],
      },
    })
    return count
  } catch {
    return 0
  }
}

export async function markChatNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
        OR: [
          { message: { contains: "sent a message in team chat" } },
          { message: { contains: "sent you a direct message" } },
        ],
      },
      data: { read: true },
    })
  } catch {
    // Silently fail
  }
}

// GET UNREAD DM COUNT PER SENDER
export async function getUnreadDMCounts(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        read: false,
        message: { contains: "sent you a direct message" },
      },
      select: { message: true },
    })

    // Count per sender name
    // Format: "John sent you a direct message"
    const counts: Record<string, number> = {}
    for (const n of notifications) {
      const senderName = n.message.replace(" sent you a direct message", "")
      counts[senderName] = (counts[senderName] ?? 0) + 1
    }

    return counts
  } catch {
    return {}
  }
}

// GET UNREAD GROUP MESSAGE COUNT
export async function getUnreadGroupMessageCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
        message: { contains: "sent a message in team chat" },
      },
    })
    return count
  } catch {
    return 0
  }
}