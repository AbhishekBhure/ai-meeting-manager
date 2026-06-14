"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { pusherServer } from "@/lib/pusher-server"

// CREATE TEAM
export async function createTeam(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const name = formData.get("name") as string
  if (!name || name.trim() === "") {
    throw new Error("Team name is required")
  }

  // Check if user already has a team
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true },
  })

  if (existingUser?.teamId) {
    throw new Error("You are already in a team")
  }

  // Create team and add current user as first member
  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      members: {
        connect: { id: session.user.id },
      },
    },
  })

  revalidatePath("/team")
  return team
}

// GET CURRENT USER'S TEAM
export async function getMyTeam() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      team: {
        include: {
          members: {
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
  })

  return user?.team ?? null
}

// JOIN TEAM VIA INVITE CODE
export async function joinTeam(inviteCode: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Find team by invite code
  const team = await prisma.team.findUnique({
    where: { inviteCode },
    include: { members: true },
  })

  if (!team) {
    throw new Error("Invalid invite code")
  }

  // Check if already a member
  const isMember = team.members.some((m) => m.id === session.user.id)
  if (isMember) {
    redirect("/team")
  }

  // Add user to team
  await prisma.user.update({
    where: { id: session.user.id },
    data: { teamId: team.id },
  })

  // Notify existing members
  await prisma.notification.createMany({
    data: team.members.map((member) => ({
      userId: member.id,
      message: `${session.user.name} joined your team!`,
    })),
  });

  // Trigger real-time Pusher event for each member
for (const member of team.members) {
  await pusherServer.trigger(
    `user-${member.id}`,
    "new-notification",
    { message: `${session.user.name} joined your team!` }
  )
}

  revalidatePath("/team")
  redirect("/team")
}

// LEAVE TEAM
// export async function leaveTeam() {
//   const session = await auth()
//   if (!session?.user?.id) redirect("/login")

//   await prisma.user.update({
//     where: { id: session.user.id },
//     data: { teamId: null },
//   })

//   revalidatePath("/team")
//   redirect("/team")
// }

export async function leaveTeam() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Get team and members BEFORE removing the user
  // After removal, we won't have access to team info anymore
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      team: {
        include: {
          members: true,
        },
      },
    },
  })

  if (!user?.team) {
    throw new Error("You are not in a team")
  }

  const teamMembers = user.team.members.filter(
    (m) => m.id !== session.user.id // exclude the leaving user
  )

  // Remove user from team
  await prisma.user.update({
    where: { id: session.user.id },
    data: { teamId: null },
  })

  // Notify remaining members
  if (teamMembers.length > 0) {
    // Save to DB
    await prisma.notification.createMany({
      data: teamMembers.map((member) => ({
        userId: member.id,
        message: `${session.user.name} left the team.`,
      })),
    })

    // Push real-time event to each remaining member
    for (const member of teamMembers) {
      await pusherServer.trigger(
        `user-${member.id}`,
        "new-notification",
        { message: `${session.user.name} left the team.` }
      )
    }
  }

  revalidatePath("/team")
  redirect("/team")
}