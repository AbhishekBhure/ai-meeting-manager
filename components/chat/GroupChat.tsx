"use client"

import { useEffect, useRef, useState } from "react"
import { getPusherClient } from "@/lib/pusher-client"
import { sendGroupMessage } from "@/actions/chat"
import MessageBubble from "./MessageBubble"
import ChatInput from "./ChatInput"

interface Message {
  id: string
  content: string
  createdAt: Date
  sender: {
    id: string
    name: string | null
    image: string | null
  }
}

interface GroupChatProps {
  teamId: string
  currentUserId: string
  initialMessages: Message[]
  canChat: boolean
}

export default function GroupChat({
  teamId,
  currentUserId,
  initialMessages,
  canChat,
}: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Subscribe to Pusher channel for real-time messages
  useEffect(() => {
    const pusherClient = getPusherClient()
    const channel = pusherClient.subscribe(`team-${teamId}`)

    channel.bind("new-group-message", (data: Message) => {
      setMessages((prev) => {
        // Avoid duplicate messages
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, data]
      })
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`team-${teamId}`)
    }
  }, [teamId])

  async function handleSend(content: string) {
    await sendGroupMessage(teamId, content)
    // No need to manually add message — Pusher will deliver it back
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-600">
              No messages yet. Say hello! 👋
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender.id === currentUserId}
            />
          ))
        )}
        {/* Invisible div at bottom — used for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={!canChat}
        placeholder="Message the team..."
      />
    </div>
  )
}