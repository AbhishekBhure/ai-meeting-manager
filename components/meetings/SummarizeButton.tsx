"use client"

import { useState } from "react"
import { summarizeMeeting } from "@/actions/ai"

interface SummarizeButtonProps {
  meetingId: string
  hasNotes: boolean
}

export default function SummarizeButton({
  meetingId,
  hasNotes,
}: SummarizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    summary: string
    taskCount: number
  } | null>(null)

  async function handleSummarize() {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await summarizeMeeting(meetingId)
      setResult(data)
      // Reload the page after 2 seconds to show updated data
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      // err is 'unknown' in TypeScript — we must check its type
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Something went wrong")
      }
    } finally {
      // Always runs — whether success or error
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSummarize}
        disabled={isLoading || !hasNotes}
        className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⟳</span>
            Analyzing notes...
          </>
        ) : (
          <>
            ✨ Summarize with AI
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Success message */}
      {result && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-3 text-sm text-green-400">
          ✓ Generated summary and {result.taskCount} task
          {result.taskCount !== 1 ? "s" : ""}. Refreshing...
        </div>
      )}

      {/* Hint when no notes */}
      {!hasNotes && (
        <p className="text-xs text-gray-600">
          Add notes to enable AI summarization
        </p>
      )}
    </div>
  )
}