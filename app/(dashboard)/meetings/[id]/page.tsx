import { getMeeting, deleteMeeting, updateMeeting } from "@/actions/meetings"
import DeleteButton from "@/components/meetings/DeleteButton"
import EditMeetingForm from "@/components/meetings/EditMeetingForm"
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