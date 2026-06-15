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

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
}

export default function MessageBubble({
  message,
  isCurrentUser,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex items-end gap-2 ${
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar — only show for other users */}
      {!isCurrentUser && (
        <div className="flex-shrink-0">
          {message.sender.image ? (
            <img
              src={message.sender.image}
              alt={message.sender.name ?? "User"}
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-xs text-white">
              {message.sender.name?.[0] ?? "?"}
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-xs rounded-2xl px-4 py-2 lg:max-w-md ${
          isCurrentUser
            ? "rounded-br-sm bg-blue-600 text-white"
            : "rounded-bl-sm bg-gray-800 text-white"
        }`}
      >
        {/* Sender name — only for group chat, other users */}
        {!isCurrentUser && (
          <p className="mb-1 text-xs font-medium text-blue-400">
            {message.sender.name}
          </p>
        )}
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p
          className={`mt-1 text-xs ${
            isCurrentUser ? "text-blue-200" : "text-gray-500"
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}