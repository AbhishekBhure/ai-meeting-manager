"use client"

import { useState } from "react"

interface ChatInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  async function handleSend() {
    const content = message.trim()
    if (!content || isSending) return

    setIsSending(true)
    setMessage("") // clear input immediately — feels responsive

    try {
      await onSend(content)
    } catch (error) {
      // Restore message if send failed
      setMessage(content)
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-3 border-t border-gray-800 p-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "You don't have chat permission" : placeholder}
        disabled={disabled || isSending}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || isSending || disabled}
        className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSending ? "..." : "Send"}
      </button>
    </div>
  )
}