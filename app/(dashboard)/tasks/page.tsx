import { getTasks } from "@/actions/tasks"
import KanbanBoard from "@/components/tasks/KanbanBoard"

export default async function TasksPage() {
  const tasks = await getTasks()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <p className="text-gray-400">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} across all meetings
        </p>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
          <p className="text-gray-400">No tasks yet</p>
          <p className="mt-2 text-sm text-gray-600">
            Create a meeting, add notes, and use AI to extract tasks
          </p>
        </div>
      ) : (
        <KanbanBoard initialTasks={tasks} />
      )}
    </div>
  )
}