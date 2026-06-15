import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMyMembership } from "@/actions/team"
import { getDirectMessages, markChatNotificationsAsRead, getUnreadDMCounts } from "@/actions/chat"
import DirectMessage from "@/components/chat/DirectMessage"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function DMPage({ params }: PageProps) {
  const { userId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getMyMembership();
await markChatNotificationsAsRead(session.user.id);
  if (!membership) redirect("/team")

    const dmCounts = await getUnreadDMCounts(session.user.id)

  // Get the other user
  const otherUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true },
  })

  if (!otherUser) notFound()

  // Verify other user is in the same team
  const otherMembership = await prisma.teamMember.findFirst({
    where: {
      userId: otherUser.id,
      teamId: membership.teamId,
    },
  })

  if (!otherMembership) notFound()

  const messages = await getDirectMessages(userId, membership.teamId)
  const otherMembers = membership.team.members.filter(
    (m) => m.user.id !== session.user.id
  )

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900">
        <div className="p-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Team Chat
          </h2>

          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <span>👥</span>
            <span>{membership.team.name}</span>
          </Link>

          <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Direct Messages
          </h2>
          <div className="space-y-1">
            {otherMembers.map((member) =>  {
                const unread = dmCounts[member.user.name ?? ""] ?? 0
                return(
              <Link
                key={member.id}
                href={`/chat/${member.user.id}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  member.user.id === userId
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {member.user.image ? (
                  <img
                    src={member.user.image}
                    alt={member.user.name ?? "User"}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs text-white">
                    {member.user.name?.[0] ?? "?"}
                  </div>
                )}
                <span className="truncate">{member.user.name}</span>

                 {/* Unread badge — hide when viewing this DM */}
      {unread > 0 && member.user.id !== userId && (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
          {unread}
        </span>
      )}
              </Link>
            )})}
          </div>
        </div>
      </div>

      {/* DM Chat */}
      <div className="flex flex-1 flex-col">
        <DirectMessage
          teamId={membership.teamId}
          currentUserId={session.user.id}
          otherUser={otherUser}
          initialMessages={messages}
          canChat={membership.canChat}
        />
      </div>
    </div>
  )
}