"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { deleteTask } from "@/actions/tasks"
import type { Task } from "@prisma/client"

type TaskWithRelations = Task & {
  meeting: { id: string; title: string } | null
  assignee: { id: string; name: string | null; image: string | null } | null
}

interface TaskCardProps {
  task: TaskWithRelations
  isDragging?: boolean
}

const priorityStyles = {
  HIGH: "bg-red-900/50 text-red-400",
  MEDIUM: "bg-yellow-900/50 text-yellow-400",
  LOW: "bg-gray-800 text-gray-400",
}

export default function TaskCard({ task, isDragging = false }: TaskCardProps) {
  // useDraggable — makes this card draggable
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  })

  // CSS.Translate.toString converts the transform object to a CSS string
  // This moves the card visually while dragging
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  async function handleDelete(e: React.MouseEvent) {
    // Stop the click from triggering drag
    e.stopPropagation()
    const confirmed = window.confirm("Delete this task?")
    if (!confirmed) return
    await deleteTask(task.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}   // drag event listeners
      {...attributes}  // accessibility attributes
      className={`group rounded-lg border bg-gray-900 p-4 cursor-grab active:cursor-grabbing transition-all ${
        isDragging
          ? "border-blue-500 shadow-lg shadow-blue-900/20 opacity-90"
          : "border-gray-800 hover:border-gray-600"
      }`}
    >
      {/* Task title */}
      <p className="text-sm text-white leading-relaxed">{task.title}</p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            priorityStyles[task.priority]
          }`}>
            {task.priority}
          </span>

          {/* Meeting source */}
          {task.meeting && (
            <span className="text-xs text-gray-600 truncate max-w-24">
              {task.meeting.title}
            </span>
          )}
        </div>

        {/* Delete button — only visible on hover */}
        <button
          onClick={handleDelete}
          className="text-gray-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}