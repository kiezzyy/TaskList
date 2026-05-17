import { Search } from 'lucide-react';
import { getVisibleTasks, useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

export function TaskBoard() {
  const { lists, statuses, selectedListId, statusFilter, searchQuery, setStatusFilter, setSearchQuery } = useWorkspaceStore();
  const selectedList = lists.find((list) => list.id === selectedListId);
  const tasks = getVisibleTasks(lists, selectedListId, statusFilter, searchQuery);

  if (!selectedList) {
    return (
      <div className="grid min-h-96 place-items-center rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold">Create a task list to begin</h2>
          <p className="mt-2 text-sm text-zinc-500">No sample data is added. Your workspace starts clean.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{selectedList.name}</h2>
          <p className="text-sm text-zinc-500">{selectedList.tasks.length} tasks in this list</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
            <input
              className="w-full rounded-md border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-900 sm:w-64"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks"
            />
          </label>
          <select className="rounded-md border border-zinc-300 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TaskForm listId={selectedList.id} />

      <div className="grid gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            No tasks match the current view.
          </div>
        ) : null}
      </div>
    </div>
  );
}
