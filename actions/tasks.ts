"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TaskStatus } from "@prisma/client"


// GET ALL TASKS for current user
export async function getTasks() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const tasks = await prisma.task.findMany({
    where: {
      meeting: {
        userId: session.user.id,
      },
    },
    include: {
      meeting: {
        select: {
          id: true,
          title: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  return tasks
}

// UPDATE TASK STATUS — called when task is dragged to new column
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify ownership through the meeting relation
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      meeting: { select: { userId: true } },
    },
  })

  if (!task || task.meeting?.userId !== session.user.id) {
    throw new Error("Not authorized")
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  })

  revalidatePath("/tasks")
}

// DELETE TASK
export async function deleteTask(taskId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      meeting: { select: { userId: true } },
    },
  })

  if (!task || task.meeting?.userId !== session.user.id) {
    throw new Error("Not authorized")
  }

  await prisma.task.delete({ where: { id: taskId } })

  revalidatePath("/tasks")
}

//ASSIGN TASK TO USER
export async function assignTask(taskId: string, assigneeId: string | null) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Verify ownership
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      meeting: { select: { userId: true, title: true } },
    },
  })

  if (!task || task.meeting?.userId !== session.user.id) {
    throw new Error("Not authorized")
  }

  // Update the task assignee
  await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
  })

  // Create notification for the assignee
  if (assigneeId && assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        message: `${session.user.name} assigned you a task: "${task.title}" from meeting "${task.meeting?.title}"`,
      },
    })
  }

  revalidatePath("/tasks")
}