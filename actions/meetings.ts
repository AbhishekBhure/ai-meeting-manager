"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// CREATE
export async function createMeeting(formData: FormData) {
  // Get the current user's session
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Extract form values — FormData is a Web API for form submissions
  const title = formData.get("title") as string
  const date = formData.get("date") as string
  const rawNotes = formData.get("rawNotes") as string

  // Validate — never trust user input
  if (!title || title.trim() === "") {
    throw new Error("Title is required")
  }

  // Save to database using Prisma
  await prisma.meeting.create({
    data: {
      title: title.trim(),
      date: date ? new Date(date) : new Date(),
      rawNotes: rawNotes || "",
      userId: session.user.id,
    },
  })

  // revalidatePath tells Next.js to refresh the cached data for this route
  revalidatePath("/meetings")

  // Redirect to meetings list
  redirect("/meetings")
}

// READ ALL — get all meetings for the current user
export async function getMeetings() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const meetings = await prisma.meeting.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      date: "desc", // newest first
    },
  })

  return meetings
}

// READ ONE — get a single meeting by ID
export async function getMeeting(id: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      tasks: true, // also fetch related tasks
    },
  })

  // Make sure user owns this meeting
  if (!meeting || meeting.userId !== session.user.id) {
    return null
  }

  return meeting
}

// UPDATE
export async function updateMeeting(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const title = formData.get("title") as string
  const rawNotes = formData.get("rawNotes") as string

  // Verify ownership before updating
  const meeting = await prisma.meeting.findUnique({ where: { id } })
  if (!meeting || meeting.userId !== session.user.id) {
    throw new Error("Not authorized")
  }

  await prisma.meeting.update({
    where: { id },
    data: {
      title: title.trim(),
      rawNotes,
      updatedAt: new Date(),
    },
  })

  revalidatePath(`/meetings/${id}`)
  revalidatePath("/meetings")
  redirect(`/meetings/${id}`)
}

// DELETE
export async function deleteMeeting(id: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify ownership before deleting
  const meeting = await prisma.meeting.findUnique({ where: { id } })
  if (!meeting || meeting.userId !== session.user.id) {
    throw new Error("Not authorized")
  }

  await prisma.meeting.delete({ where: { id } })

  revalidatePath("/meetings")
  redirect("/meetings")
}