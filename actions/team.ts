"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TeamRole } from "@prisma/client"
import { pusherServer } from "@/lib/pusher-server"

// Helper — get current user's membership in their team
// Returns null if user is not in any team
export async function getMyMembership() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return membership
}

// GET CURRENT USER'S TEAM
export async function getMyTeam() {
  const membership = await getMyMembership()
  return membership?.team ?? null
}

// CREATE TEAM
export async function createTeam(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const name = formData.get("name") as string
  if (!name || name.trim() === "") {
    throw new Error("Team name is required")
  }

  // Check if user already has a team
  const existingMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  })

  if (existingMembership) {
    throw new Error("You are already in a team")
  }

  // Create team with current user as OWNER
  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: TeamRole.OWNER,
          canChat: true,
        },
      },
    },
  })

  revalidatePath("/team")
  return team
}

// JOIN TEAM VIA INVITE CODE
export async function joinTeam(inviteCode: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Find team by invite code
  const team = await prisma.team.findUnique({
    where: { inviteCode },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!team) throw new Error("Invalid invite code")

  // Check if already a member
  const isMember = team.members.some((m) => m.userId === session.user.id)
  if (isMember) redirect("/team")

  // Add user as MEMBER
  await prisma.teamMember.create({
    data: {
      userId: session.user.id,
      teamId: team.id,
      role: TeamRole.MEMBER,
      canChat: true,
    },
  })

  // Notify existing members
  const otherMembers = team.members.filter(
    (m) => m.userId !== session.user.id
  )

  if (otherMembers.length > 0) {
    await prisma.notification.createMany({
      data: otherMembers.map((m) => ({
        userId: m.userId,
        message: `${session.user.name} joined your team!`,
      })),
    })

    for (const m of otherMembers) {
      await pusherServer.trigger(
        `user-${m.userId}`,
        "new-notification",
        { message: `${session.user.name} joined your team!` }
      )
    }
  }

  revalidatePath("/team")
  redirect("/team")
}

// LEAVE TEAM
export async function leaveTeam() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          members: true,
        },
      },
    },
  })

  if (!membership) throw new Error("You are not in a team")

  // Owner cannot leave — must delete team or transfer ownership
  if (membership.role === TeamRole.OWNER) {
    throw new Error(
      "You are the owner. Transfer ownership or delete the team first."
    )
  }

  // Remove membership
  await prisma.teamMember.delete({
    where: { id: membership.id },
  })

  // Notify remaining members
  const remainingMembers = membership.team.members.filter(
    (m) => m.userId !== session.user.id
  )

  if (remainingMembers.length > 0) {
    await prisma.notification.createMany({
      data: remainingMembers.map((m) => ({
        userId: m.userId,
        message: `${session.user.name} left the team.`,
      })),
    })

    for (const m of remainingMembers) {
      await pusherServer.trigger(
        `user-${m.userId}`,
        "new-notification",
        { message: `${session.user.name} left the team.` }
      )
    }
  }

  revalidatePath("/team")
  redirect("/team")
}

// KICK MEMBER — OWNER only
export async function kickMember(targetUserId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify caller is OWNER
  const callerMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!callerMembership || callerMembership.role !== TeamRole.OWNER) {
    throw new Error("Only the team owner can kick members")
  }

  // Delete target's membership
  await prisma.teamMember.deleteMany({
    where: {
      userId: targetUserId,
      teamId: callerMembership.teamId,
    },
  })

  // Notify the kicked user
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      message: "You have been removed from the team.",
    },
  })

  await pusherServer.trigger(
    `user-${targetUserId}`,
    "new-notification",
    { message: "You have been removed from the team." }
  )

  revalidatePath("/team")
}

// CHANGE ROLE — OWNER only
export async function changeMemberRole(
  targetUserId: string,
  newRole: TeamRole
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify caller is OWNER
  const callerMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!callerMembership || callerMembership.role !== TeamRole.OWNER) {
    throw new Error("Only the team owner can change roles")
  }

  // Cannot change owner's own role
  if (targetUserId === session.user.id) {
    throw new Error("Cannot change your own role")
  }

  await prisma.teamMember.updateMany({
    where: {
      userId: targetUserId,
      teamId: callerMembership.teamId,
    },
    data: { role: newRole },
  })

  revalidatePath("/team")
}

// TOGGLE CHAT PERMISSION — OWNER only
export async function toggleChatPermission(
  targetUserId: string,
  canChat: boolean
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify caller is OWNER
  const callerMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!callerMembership || callerMembership.role !== TeamRole.OWNER) {
    throw new Error("Only the team owner can change chat permissions")
  }

  await prisma.teamMember.updateMany({
    where: {
      userId: targetUserId,
      teamId: callerMembership.teamId,
    },
    data: { canChat },
  })

  // Notify the affected user
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      message: canChat
        ? "You can now send messages in the team chat."
        : "Your chat permission has been revoked.",
    },
  })

  await pusherServer.trigger(
    `user-${targetUserId}`,
    "new-notification",
    {
      message: canChat
        ? "You can now send messages in the team chat."
        : "Your chat permission has been revoked.",
    }
  )

  revalidatePath("/team")
}

// DELETE TEAM — OWNER only
export async function deleteTeam() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: { team: { include: { members: true } } },
  })

  if (!membership || membership.role !== TeamRole.OWNER) {
    throw new Error("Only the team owner can delete the team")
  }

  // Notify all members before deletion
  const otherMembers = membership.team.members.filter(
    (m) => m.userId !== session.user.id
  )

  if (otherMembers.length > 0) {
    await prisma.notification.createMany({
      data: otherMembers.map((m) => ({
        userId: m.userId,
        message: `The team "${membership.team.name}" has been deleted.`,
      })),
    })

    for (const m of otherMembers) {
      await pusherServer.trigger(
        `user-${m.userId}`,
        "new-notification",
        { message: `The team "${membership.team.name}" has been deleted.` }
      )
    }
  }

  await prisma.team.delete({
    where: { id: membership.teamId },
  })

  revalidatePath("/team")
  redirect("/team")
}