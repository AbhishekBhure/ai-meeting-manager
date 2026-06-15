"use client"

import { useEffect, useRef, useState } from "react"
import { getPusherClient } from "@/lib/pusher-client"
import { sendDirectMessage } from "@/actions/chat"
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

interface DirectMessageProps {
  teamId: string
  currentUserId: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
  }
  initialMessages: Message[]
  canChat: boolean
}

export default function DirectMessage({
  teamId,
  currentUserId,
  otherUser,
  initialMessages,
  canChat,
}: DirectMessageProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const pusherClient = getPusherClient()

    // Same sorted channel name as server
    const dmChannel = `dm-${[currentUserId, otherUser.id].sort().join("-")}`
    const channel = pusherClient.subscribe(dmChannel)

    channel.bind("new-dm", (data: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, data]
      })
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(dmChannel)
    }
  }, [currentUserId, otherUser.id])

  async function handleSend(content: string) {
    await sendDirectMessage(otherUser.id, teamId, content)
  }

  return (
    <div className="flex h-full flex-col">
      {/* DM Header */}
      <div className="flex items-center gap-3 border-b border-gray-800 p-4">
        {otherUser.image ? (
          <img
            src={otherUser.image}
            alt={otherUser.name ?? "User"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm text-white">
            {otherUser.name?.[0] ?? "?"}
          </div>
        )}
        <div>
          <p className="font-medium text-white">{otherUser.name}</p>
          <p className="text-xs text-green-400">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-600">
              Start a conversation with {otherUser.name}
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={!canChat}
        placeholder={`Message ${otherUser.name}...`}
      />
    </div>
  )
}