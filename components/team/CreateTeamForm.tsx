"use client"

import { useState } from "react"
import { createTeam } from "@/actions/team"
import { useRouter } from "next/navigation"

export default function CreateTeamForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      await createTeam(formData)
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
      <h2 className="mb-2 text-lg font-semibold text-white">
        Create a Team
      </h2>
      <p className="mb-6 text-sm text-gray-400">
        Create a team to collaborate on meetings and tasks with your colleagues.
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Team Name
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Product Team"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Team"}
        </button>
      </form>
    </div>
  )
}