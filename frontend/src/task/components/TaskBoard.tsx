import { LayoutGrid, PanelTop, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { DragEvent, useMemo, useState } from 'react';
import { taskStatusNames } from '../../shared/applicationConstants';
import { getVisibleTasks, useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Task, TaskStatus } from '../services/types';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

const columnStyles: Record<string, { dot: string; bg: string }> = {
  [taskStatusNames.todo]: { dot: 'bg-violet-500', bg: 'bg-violet-50/60' },
  [taskStatusNames.inProgress]: { dot: 'bg-amber-400', bg: 'bg-amber-50/70' },
  [taskStatusNames.reviewing]: { dot: 'bg-cyan-500', bg: 'bg-cyan-50/70' },
  [taskStatusNames.complete]: { dot: 'bg-emerald-500', bg: 'bg-emerald-50/70' }
};

export function TaskBoard() {
  const {
    lists,
    priorities,
    statuses,
    selectedListId,
    statusFilter,
    priorityFilter,
    searchQuery,
    setPriorityFilter,
    setStatusFilter,
    setSearchQuery,
    updateTask
  } = useWorkspaceStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const selectedList = lists.find((list) => list.id === selectedListId);
  const tasks = getVisibleTasks(lists, selectedListId, statusFilter, priorityFilter, searchQuery);
  const orderedStatuses = useMemo(() => [...statuses].sort((first, second) => first.sortOrder - second.sortOrder), [statuses]);

  if (!selectedList) {
    return (
      <div className="grid min-h-96 place-items-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold">Create a workspace tab to begin</h2>
          <p className="mt-2 text-sm text-zinc-500">Your local SQL workspace starts clean and stays private.</p>
        </div>
      </div>
    );
  }

  async function moveTask(event: DragEvent, statusId: string) {
    event.preventDefault();
    if (!draggedTaskId) {
      return;
    }
    await updateTask(draggedTaskId, { statusId });
    setDraggedTaskId(null);
  }

  return (
    <div id="workspace" className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Workspace</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">{selectedList.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {selectedList.tasks.length} tasks across {orderedStatuses.length} kanban stages
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(180px,280px)_auto_auto_auto_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
            <input
              className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-zinc-900"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks"
            />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-2.5 text-zinc-400" size={16} />
            <select className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {orderedStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>
          <select className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">All priorities</option>
            {priorities.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.name}
              </option>
            ))}
          </select>
          <button
            className={`grid h-10 w-10 place-items-center rounded-md border transition-all duration-200 hover:-translate-y-0.5 ${
              compactMode ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
            title={compactMode ? 'Disable compact cards' : 'Enable compact cards'}
            onClick={() => setCompactMode((value) => !value)}
          >
            {compactMode ? <PanelTop className="transition-transform duration-200 rotate-180" size={17} /> : <LayoutGrid className="transition-transform duration-200" size={17} />}
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-zinc-800" onClick={() => setTaskModalOpen(true)}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      <TaskForm listId={selectedList.id} open={taskModalOpen} onClose={() => setTaskModalOpen(false)} />

      <div className="grid min-h-[28rem] gap-3 overflow-x-auto pb-2 lg:grid-cols-4">
        {orderedStatuses.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={sortColumnTasks(tasks.filter((task) => task.statusId === status.id))}
            compact={compactMode}
            onDrop={moveTask}
            onDragStart={setDraggedTaskId}
          />
        ))}
      </div>
    </div>
  );
}

function sortColumnTasks(tasks: Task[]) {
  return [...tasks].sort((first, second) => new Date(first.updatedAt).getTime() - new Date(second.updatedAt).getTime());
}

function KanbanColumn({
  status,
  tasks,
  compact,
  onDrop,
  onDragStart
}: {
  status: TaskStatus;
  tasks: Task[];
  compact: boolean;
  onDrop: (event: DragEvent, statusId: string) => Promise<void>;
  onDragStart: (taskId: string) => void;
}) {
  const style = columnStyles[status.name] ?? { dot: 'bg-zinc-400', bg: 'bg-zinc-50' };

  return (
    <section
      className={`flex min-h-[26rem] min-w-[18rem] flex-col rounded-lg border border-zinc-200 ${style.bg} p-3 transition-all duration-200`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDrop(event, status.id)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
          <h3 className="truncate text-sm font-semibold text-zinc-900">{status.name}</h3>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500 shadow-sm">{tasks.length}</span>
      </div>
      <div className={`grid transition-all duration-200 ${compact ? 'gap-2' : 'gap-3'}`}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} compact={compact} onDragStart={onDragStart} />
        ))}
        {tasks.length === 0 ? <div className="rounded-lg border border-dashed border-zinc-300 bg-white/60 p-4 text-center text-sm text-zinc-500">Drop tasks here</div> : null}
      </div>
    </section>
  );
}
