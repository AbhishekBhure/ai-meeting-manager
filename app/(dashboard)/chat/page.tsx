import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMyMembership } from "@/actions/team"
import { getGroupMessages, getUnreadDMCounts, markChatNotificationsAsRead, getUnreadGroupMessageCount } from "@/actions/chat"
import GroupChat from "@/components/chat/GroupChat"
import Link from "next/link"


export default async function ChatPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getMyMembership();

  if (!membership) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">You are not in a team yet.</p>
          <Link
            href="/team"
            className="mt-4 inline-block text-blue-400 hover:underline"
          >
            Create or join a team
          </Link>
        </div>
      </div>
    )
  }

  // Get unread counts FIRST before marking as read
  const messages = await getGroupMessages(membership.teamId);
  const dmCounts = await getUnreadDMCounts(session.user.id)
  const groupMessageCount = await getUnreadGroupMessageCount(session.user.id)
  
  // Now mark as read after capturing the counts
  await markChatNotificationsAsRead(session.user.id);
  const otherMembers = membership.team.members.filter(
    (m) => m.user.id !== session.user.id
  )

  return (
    <div className="flex h-screen">
      {/* Sidebar — member list for DMs */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900">
        <div className="p-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Team Chat
          </h2>

          {/* Group chat link */}
          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            <span>👥</span>
            <span>{membership.team.name}</span>
            {groupMessageCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                {groupMessageCount}
              </span>
            )}
          </Link>

          {/* DM section */}
          <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Direct Messages
          </h2>
          <div className="space-y-1">
            {otherMembers.map((member) => { 
                 // Look up unread count by sender name
              const unread = dmCounts[member.user.name ?? ""] ?? 0
                return (
              
              
              <Link
                key={member.id}
                href={`/chat/${member.user.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
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
                 {/* Unread DM badge */}
                  {unread > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                      {unread}
                    </span>
                  )}
              </Link>
    )})}
          </div>
        </div>
      </div>

      {/* Group Chat */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-800 p-4">
          <h1 className="font-semibold text-white">
            # {membership.team.name}
          </h1>
          <p className="text-xs text-gray-500">
            {membership.team.members.length} members
          </p>
        </div>
        <GroupChat
          teamId={membership.teamId}
          currentUserId={session.user.id}
          initialMessages={messages}
          canChat={membership.canChat}
        />
      </div>
    </div>
  )
}