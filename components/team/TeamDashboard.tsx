"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  leaveTeam,
  kickMember,
  changeMemberRole,
  toggleChatPermission,
  deleteTeam,
} from "@/actions/team"
import { TeamRole } from "@prisma/client"

interface Member {
  id: string
  role: TeamRole
  canChat: boolean
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface Team {
  id: string
  name: string
  inviteCode: string
  ownerId: string
  members: Member[]
}

interface TeamDashboardProps {
  team: Team
  currentUserId: string
  currentUserRole: TeamRole
}

export default function TeamDashboard({
  team,
  currentUserId,
  currentUserRole,
}: TeamDashboardProps) {
  const [copied, setCopied] = useState(false)
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)
  const router = useRouter()

  const isOwner = currentUserRole === TeamRole.OWNER
  const isAdmin = currentUserRole === TeamRole.ADMIN
  const canInvite = isOwner || isAdmin

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${team.inviteCode}`
      : ""

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLeave() {
    const confirmed = window.confirm("Are you sure you want to leave?")
    if (!confirmed) return
    await leaveTeam()
    router.refresh()
  }

  async function handleKick(userId: string, name: string) {
    const confirmed = window.confirm(`Kick ${name} from the team?`)
    if (!confirmed) return
    setLoadingMemberId(userId)
    try {
      await kickMember(userId)
      router.refresh()
    } finally {
      setLoadingMemberId(null)
    }
  }

  async function handleRoleChange(userId: string, newRole: TeamRole) {
    setLoadingMemberId(userId)
    try {
      await changeMemberRole(userId, newRole)
      router.refresh()
    } finally {
      setLoadingMemberId(null)
    }
  }

  async function handleToggleChat(userId: string, canChat: boolean) {
    setLoadingMemberId(userId)
    try {
      await toggleChatPermission(userId, !canChat)
      router.refresh()
    } finally {
      setLoadingMemberId(null)
    }
  }

  async function handleDeleteTeam() {
    const confirmed = window.confirm(
      "Are you sure you want to DELETE the team? This cannot be undone."
    )
    if (!confirmed) return
    await deleteTeam()
    router.refresh()
  }

  // Role badge styles
  const roleBadge: Record<TeamRole, string> = {
    OWNER: "bg-yellow-900/50 text-yellow-400",
    ADMIN: "bg-blue-900/50 text-blue-400",
    MEMBER: "bg-gray-800 text-gray-400",
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{team.name}</h2>
            <p className="text-sm text-gray-400">
              {team.members.length} member
              {team.members.length !== 1 ? "s" : ""}
            </p>
            {/* Current user's role badge */}
            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[currentUserRole]}`}>
              Your role: {currentUserRole}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Only non-owners can leave */}
            {!isOwner && (
              <button
                onClick={handleLeave}
                className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 transition hover:bg-red-900/20"
              >
                Leave Team
              </button>
            )}

            {/* Only owner can delete */}
            {isOwner && (
              <button
                onClick={handleDeleteTeam}
                className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 transition hover:bg-red-900/20"
              >
                Delete Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Link — only for OWNER and ADMIN */}
      {canInvite && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-4 font-semibold text-white">
            Invite Teammates
          </h3>
          <div className="flex gap-3">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300"
            />
            <button
              onClick={handleCopyLink}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-4 font-semibold text-white">Members</h3>
        <div className="space-y-4">
          {team.members.map((member) => {
            const isCurrentUser = member.user.id === currentUserId
            const isLoading = loadingMemberId === member.user.id

            return (
              <div
                key={member.id}
                className="flex items-center justify-between"
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name ?? "Member"}
                      className="h-9 w-9 rounded-full"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-sm text-white">
                      {member.user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        {member.user.name}
                        {isCurrentUser && (
                          <span className="ml-1 text-gray-500">(you)</span>
                        )}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[member.role]}`}>
                        {member.role}
                      </span>
                      {/* Chat permission indicator */}
                      {!member.canChat && (
                        <span className="rounded-full bg-red-900/30 px-2 py-0.5 text-xs text-red-500">
                          Chat disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {member.user.email}
                    </p>
                  </div>
                </div>

                {/* OWNER controls — only shown to owner, not for themselves */}
                {isOwner && !isCurrentUser && (
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <span className="text-xs text-gray-500">
                        Updating...
                      </span>
                    ) : (
                      <>
                        {/* Role selector */}
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.user.id,
                              e.target.value as TeamRole
                            )
                          }
                          className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white"
                        >
                          <option value={TeamRole.MEMBER}>Member</option>
                          <option value={TeamRole.ADMIN}>Admin</option>
                        </select>

                        {/* Toggle chat */}
                        <button
                          onClick={() =>
                            handleToggleChat(member.user.id, member.canChat)
                          }
                          className={`rounded-lg border px-2 py-1 text-xs transition ${
                            member.canChat
                              ? "border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400"
                              : "border-green-700 text-green-400 hover:bg-green-900/20"
                          }`}
                        >
                          {member.canChat ? "Disable Chat" : "Enable Chat"}
                        </button>

                        {/* Kick button */}
                        <button
                          onClick={() =>
                            handleKick(
                              member.user.id,
                              member.user.name ?? "this member"
                            )
                          }
                          className="rounded-lg border border-red-800 px-2 py-1 text-xs text-red-400 transition hover:bg-red-900/20"
                        >
                          Kick
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}