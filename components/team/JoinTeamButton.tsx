"use client"

import { useState } from "react"
import { joinTeam } from "@/actions/team"

interface JoinTeamButtonProps {
  inviteCode: string
  teamName: string
}

export default function JoinTeamButton({
  inviteCode,
  teamName,
}: JoinTeamButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setIsLoading(true)
    setError(null)

    try {
      await joinTeam(inviteCode)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleJoin}
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Joining..." : `Join ${teamName}`}
      </button>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}