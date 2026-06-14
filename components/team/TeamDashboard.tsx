"use client"

import { useState } from "react"
import { leaveTeam } from "@/actions/team"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface Team {
  id: string
  name: string
  inviteCode: string
  members: Member[]
}

interface TeamDashboardProps {
  team: Team
}

export default function TeamDashboard({ team }: TeamDashboardProps) {
  const [copied, setCopied] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const router = useRouter()

  const inviteLink = `${window.location.origin}/invite/${team.inviteCode}`

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLeave() {
    const confirmed = window.confirm(
      "Are you sure you want to leave this team?"
    )
    if (!confirmed) return

    setIsLeaving(true)
    try {
      await leaveTeam()
      router.refresh()
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{team.name}</h2>
            <p className="text-sm text-gray-400">
              {team.members.length} member{team.members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleLeave}
            disabled={isLeaving}
            className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 transition hover:bg-red-900/20 disabled:opacity-50"
          >
            {isLeaving ? "Leaving..." : "Leave Team"}
          </button>
        </div>
      </div>

      {/* Invite Link */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-4 font-semibold text-white">Invite Teammates</h3>
        <p className="mb-3 text-sm text-gray-400">
          Share this link with your teammates to invite them to your team.
        </p>
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

      {/* Members List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-4 font-semibold text-white">Members</h3>
        <div className="space-y-3">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3"
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name ?? "Member"}
                  className="h-9 w-9 rounded-full"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-sm text-white">
                  {member.name?.[0] ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}