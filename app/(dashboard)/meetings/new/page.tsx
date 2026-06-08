import { createMeeting } from "@/actions/meetings"

export default function NewMeetingPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-2xl font-bold text-white">
          New Meeting
        </h1>

        {/* 
          form action={createMeeting} — this is how Server Actions 
          connect to forms. When submitted, Next.js calls createMeeting 
          with the FormData automatically. No onClick, no fetch needed.
        */}
        <form action={createMeeting} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Meeting Title
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. Q4 Planning Session"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Date
            </label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Notes (optional)
            </label>
            <textarea
              name="rawNotes"
              rows={8}
              placeholder="Add meeting notes here..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Create Meeting
            </button>
            <a
              href="/meetings"
              className="rounded-lg border border-gray-700 px-6 py-3 font-medium text-gray-300 transition hover:bg-gray-800"
            >
              Cancel
            </a>
          </div>
      </form>
      </div>
    </div>
  )
}