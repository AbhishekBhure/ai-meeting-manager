"use client"

import { useDroppable } from "@dnd-kit/core"
import TaskCard from "./TaskCard"
import type { Task, Meeting } from "@prisma/client"

type TaskWithRelations = Task & {
  meeting: { id: string; title: string } | null
  assignee: { id: string; name: string | null; image: string | null } | null
}

interface KanbanColumnProps {
  id: string
  label: string
  color: string
  tasks: TaskWithRelations[]
}

export default function KanbanColumn({
  id,
  label,
  color,
  tasks,
}: KanbanColumnProps) {
  // useDroppable — makes this div a valid drop target
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex w-80 flex-shrink-0 flex-col">
      {/* Column header */}
      <div className={`mb-3 flex items-center justify-between rounded-lg border ${color} bg-gray-900 px-4 py-3`}>
        <h3 className="font-semibold text-white">{label}</h3>
        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 rounded-xl border-2 border-dashed p-3 transition-colors min-h-32 ${
          isOver
            ? "border-blue-500 bg-blue-900/10"
            : "border-gray-800 bg-gray-900/50"
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-700">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  )
}