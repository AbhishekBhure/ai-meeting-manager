import { getMeeting, deleteMeeting, updateMeeting } from "@/actions/meetings"
import DeleteButton from "@/components/meetings/DeleteButton"
import EditMeetingForm from "@/components/meetings/EditMeetingForm"
import SummarizeButton from "@/components/meetings/SummarizeButton"
import { notFound } from "next/navigation"


// PageProps — Next.js passes route params as props to page components
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MeetingPage({ params }: PageProps) {
  const { id } = await params
  const meeting = await getMeeting(id)

  // notFound() renders Next.js's built-in 404 page
  if (!meeting) notFound()

  // Bind the id to updateMeeting so the form only needs to pass FormData
  const updateMeetingWithId = updateMeeting.bind(null, meeting.id)

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <a href="/meetings" className="text-sm text-gray-500 hover:text-gray-300">
              ← Back to meetings
            </a>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {meeting.title}
            </h1>
            <p className="text-gray-400">
              {new Date(meeting.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <DeleteButton meetingId={meeting.id} />
        </div>

        {/* AI Summary Section */}
        <div className="mb-8 rounded-xl border border-purple-800/50 bg-purple-900/10 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-purple-300">✨ AI Summary</h2>
            <SummarizeButton
              meetingId={meeting.id}
              hasNotes={!!meeting.rawNotes && meeting.rawNotes.trim() !== ""}
            />
          </div>

          {meeting.summary ? (
            <p className="text-gray-300 leading-relaxed">{meeting.summary}</p>
          ) : (
            <p className="text-gray-600 text-sm">
              No summary yet. Add notes and click "Summarize with AI".
            </p>
          )}
        </div>

{/* Tasks Section */}
        {meeting.tasks.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Extracted Tasks ({meeting.tasks.length})
            </h2>
            <div className="space-y-2">
              {meeting.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-4"
                >
                  <p className="text-white">{task.title}</p>
                  <div className="flex items-center gap-3">
                    {/* Priority badge */}
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      task.priority === "HIGH"
                        ? "bg-red-900/50 text-red-400"
                        : task.priority === "MEDIUM"
                        ? "bg-yellow-900/50 text-yellow-400"
                        : "bg-gray-800 text-gray-400"
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-600">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Form */}
        <EditMeetingForm
          meeting={meeting}
          updateAction={updateMeetingWithId}
        />

        {/* Tasks section — placeholder for Phase 5 */}
        {meeting.tasks.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Tasks ({meeting.tasks.length})
            </h2>
            <div className="space-y-2">
              {meeting.tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-4"
                >
                  <p className="text-white">{task.title}</p>
                  <span className="text-xs text-gray-500">{task.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}