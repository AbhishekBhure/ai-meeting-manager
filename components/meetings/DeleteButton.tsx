"use client"

import { deleteMeeting } from "@/actions/meetings"

interface DeleteButtonProps {
  meetingId: string
}

export default function DeleteButton({ meetingId }: DeleteButtonProps) {
  async function handleDelete() {
    // Confirm before deleting — window only available client-side
    const confirmed = window.confirm(
      "Are you sure you want to delete this meeting?"
    )
    if (!confirmed) return

    // Call server action directly from client component
    await deleteMeeting(meetingId)
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 transition hover:bg-red-900/20"
    >
      Delete
    </button>
  )
}