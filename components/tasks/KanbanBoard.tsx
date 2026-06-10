"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { updateTaskStatus } from "@/actions/tasks"
import KanbanColumn from "./KanbanColumn"
import TaskCard from "./TaskCard"

// Import the Prisma type for Task with its relations
import type { Task, Meeting } from "@prisma/client"

// Define the shape of a task with its included relations
type TaskWithRelations = Task & {
  meeting: { id: string; title: string } | null
  assignee: { id: string; name: string | null; image: string | null } | null
}

// Define our columns
const COLUMNS = [
  { id: "TODO", label: "To Do", color: "border-gray-700" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-blue-700" },
  { id: "DONE", label: "Done", color: "border-green-700" },
] as const

// 'as const' makes the array readonly and the strings literal types
// without it: id is type 'string'
// with it:    id is type 'TODO' | 'IN_PROGRESS' | 'DONE'

interface KanbanBoardProps {
  initialTasks: TaskWithRelations[]
}

export default function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  // Local state for tasks — this is what renders on screen
  const [tasks, setTasks] = useState(initialTasks)

  // Track which task is being dragged (for DragOverlay)
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)

  // Configure sensors — how drag is initiated
  // PointerSensor requires 8px movement before drag starts
  // This prevents accidental drags when clicking
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // Called when drag starts
  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  // Called when drag ends — this is where the magic happens
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    setActiveTask(null)

    // 'over' is null if dropped outside a valid column
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as "TODO" | "IN_PROGRESS" | "DONE"

    // Find the task being moved
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    // OPTIMISTIC UPDATE — update UI immediately before DB call
    // Save previous state so we can roll back if DB fails
    const previousTasks = tasks

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    )

    // Update database in background
    try {
      await updateTaskStatus(taskId, newStatus)
    } catch (error) {
      // ROLLBACK — DB failed, revert UI to previous state
      console.error("Failed to update task:", error)
      setTasks(previousTasks)
    }
  }

  // Group tasks by status for each column
  function getTasksForColumn(status: string) {
    return tasks.filter((t) => t.status === status)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            label={column.label}
            color={column.color}
            tasks={getTasksForColumn(column.id)}
          />
        ))}
      </div>

      {/* DragOverlay — renders the task card while it's being dragged */}
      {/* Without this, the dragged card would just disappear */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}