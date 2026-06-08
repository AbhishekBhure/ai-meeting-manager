import { getMeetings } from "@/actions/meetings"
import Link from "next/link"

export default async function MeetingsPage() {
  // Directly await the server action — no useEffect, no fetch
  const meetings = await getMeetings()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <p className="text-gray-400">
            {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/meetings/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + New Meeting
        </Link>
      </div>

      {/* Empty state */}
      {meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
          <p className="text-gray-400">No meetings yet</p>
          <Link
            href="/meetings/new"
            className="mt-4 inline-block text-sm text-blue-400 hover:underline"
          >
            Create your first meeting
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/meetings/${meeting.id}`}
              className="block rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-white">
                    {meeting.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {new Date(meeting.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-xs text-gray-600">
                  {meeting.rawNotes ? "Has notes" : "No notes"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}