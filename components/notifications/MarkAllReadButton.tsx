"use client"

import { markAllAsRead } from "@/actions/notifications"
import { useTransition } from "react"

export default function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await markAllAsRead()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
    >
      {isPending ? "Marking..." : "Mark all as read"}
    </button>
  )
}