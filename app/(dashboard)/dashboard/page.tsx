import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMeetings } from "@/actions/meetings"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const meetings = await getMeetings()
  const recentMeetings = meetings.slice(0, 3)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-400">
          Here's what's happening with your meetings
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">Total Meetings</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {meetings.length}
          </p>
        </div>
      </div>

      {/* Recent meetings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Recent Meetings
          </h2>
          <Link href="/meetings" className="text-sm text-blue-400 hover:underline">
            View all
          </Link>
        </div>
        {recentMeetings.length === 0 ? (
          <p className="text-gray-500">No meetings yet</p>
        ) : (
          <div className="space-y-3">
            {recentMeetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="block rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-600"
              >
                <p className="font-medium text-white">{meeting.title}</p>
                <p className="text-sm text-gray-400">
                  {new Date(meeting.date).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}