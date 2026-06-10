"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { geminiModel } from "@/lib/gemini"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// TypeScript — define exactly what shape we expect from AI
interface AIResponse {
  summary: string
  tasks: {
    title: string
    priority: "LOW" | "MEDIUM" | "HIGH"
  }[]
}

export async function summarizeMeeting(meetingId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // 1. Fetch the meeting
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
  })

  if (!meeting || meeting.userId !== session.user.id) {
    throw new Error("Meeting not found")
  }

  if (!meeting.rawNotes || meeting.rawNotes.trim() === "") {
    throw new Error("No notes to summarize")
  }

  // 2. Build the prompt — this is prompt engineering
  // We tell the AI exactly what format to return
  const prompt = `
You are an AI assistant that analyzes meeting notes.

Given the following meeting notes, you must:
1. Write a concise summary (2-3 sentences max)
2. Extract all action items and tasks mentioned

IMPORTANT: You must respond with ONLY a valid JSON object.
No explanation, no markdown, no code blocks. Just raw JSON.

The JSON must follow this exact structure:
{
  "summary": "string - 2-3 sentence summary of the meeting",
  "tasks": [
    {
      "title": "string - clear, actionable task description",
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}

Priority rules:
- HIGH: urgent, blockers, deadlines mentioned, critical issues
- MEDIUM: important but not urgent, follow-ups
- LOW: nice to have, future considerations

Meeting Title: ${meeting.title}
Meeting Notes:
${meeting.rawNotes}

Respond with JSON only:
`

  // 3. Call Gemini API
  const result = await geminiModel.generateContent(prompt)
  const responseText = result.response.text()

  // 4. Parse the AI response
  // AI sometimes wraps JSON in markdown code blocks — strip those
  const cleanedResponse = responseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  let parsed: AIResponse
  try {
    parsed = JSON.parse(cleanedResponse)
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.")
  }

  // 5. Validate the parsed response has what we need
  if (!parsed.summary || !Array.isArray(parsed.tasks)) {
    throw new Error("AI response missing required fields")
  }

  // 6. Save summary to meeting
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { summary: parsed.summary },
  })

  // 7. Save extracted tasks to database
  if (parsed.tasks.length > 0) {
    // Delete existing AI-generated tasks first to avoid duplicates
    await prisma.task.deleteMany({
      where: {
        meetingId,
        // Only delete tasks that haven't been manually modified
        status: "TODO",
      },
    })

    // Create all tasks at once with createMany
    await prisma.task.createMany({
      data: parsed.tasks.map((task) => ({
        title: task.title,
        priority: task.priority,
        status: "TODO",
        meetingId,
        assigneeId: null,
      })),
    })
  }

  revalidatePath(`/meetings/${meetingId}`)

  return {
    summary: parsed.summary,
    taskCount: parsed.tasks.length,
  }
}