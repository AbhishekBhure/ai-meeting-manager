"use client"

import { useTransition } from "react"

interface Meeting {
  id: string
  title: string
  rawNotes: string | null
}

interface EditMeetingFormProps {
  meeting: Meeting
  updateAction: (formData: FormData) => Promise<void>
}

export default function EditMeetingForm({
  meeting,
  updateAction,
}: EditMeetingFormProps) {
  // useTransition — tracks when a server action is pending
  // isPending = true while the server action is running
  const [isPending, startTransition] = useTransition()

  return (
    <form action={updateAction} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Title
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={meeting.title}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Notes
        </label>
        <textarea
          name="rawNotes"
          rows={12}
          defaultValue={meeting.rawNotes ?? ""}
          placeholder="Add your meeting notes here..."
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  )
}