import { Check, ChevronRight, GripVertical, Pencil, Trash2, X } from 'lucide-react';
import { MouseEvent, useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Task } from '../services/types';
import { formatDateTime } from '../utils/time';
import { TaskTimer } from './TaskTimer';

export function TaskCard({ task, compact, onDragStart }: { task: Task; compact: boolean; onDragStart: (taskId: string) => void }) {
  const { updateTask, deleteTask } = useWorkspaceStore();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? '');

  async function save() {
    await updateTask(task.id, { name: name.trim(), description: description.trim() || null });
    setEditing(false);
  }

  function stopCardClick(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <>
      <article
        className={`group w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-200/60 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md ${
          compact ? 'h-16 p-2.5' : 'h-56 p-3'
        }`}
        draggable={!editing}
        onClick={() => {
          if (!editing) {
            setDetailsOpen(true);
          }
        }}
        onDragStart={() => onDragStart(task.id)}
      >
        <div className={`flex h-full flex-col ${compact ? 'gap-2' : 'gap-2.5'}`}>
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <GripVertical className="mt-1 shrink-0 text-zinc-300 transition group-hover:text-zinc-500" size={16} />
              <ChevronRight className="mt-1 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700" size={16} />
              {editing ? (
                <input
                  className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
                  value={name}
                  onClick={stopCardClick}
                  onChange={(event) => setName(event.target.value)}
                />
              ) : (
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-zinc-900">{task.name}</h3>
              )}
            </div>

            {editing ? (
              <textarea
                className="mt-2 min-h-20 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                value={description}
                onClick={stopCardClick}
                onChange={(event) => setDescription(event.target.value)}
              />
            ) : task.description && !compact ? (
              <p className="mt-2 line-clamp-2 max-h-12 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-zinc-600">{task.description}</p>
            ) : null}
          </div>

          <div className={`mt-auto flex-wrap items-center gap-2 text-xs text-zinc-500 ${compact ? 'hidden' : 'flex'}`} onClick={stopCardClick}>
            <TaskTimer task={task} />
            <span>Updated {formatDateTime(task.updatedAt)}</span>
          </div>

          <div className={`flex-wrap items-center gap-2 ${compact ? 'hidden' : 'flex'}`} onClick={stopCardClick}>
            {editing ? (
              <>
                <button className="grid h-8 w-8 place-items-center rounded-md bg-zinc-950 text-white" title="Save task" onClick={save}>
                  <Check size={15} />
                </button>
                <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200" title="Cancel edit" onClick={() => setEditing(false)}>
                  <X size={15} />
                </button>
              </>
            ) : (
              <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50" title="Edit task" onClick={() => setEditing(true)}>
                <Pencil size={15} />
              </button>
            )}
            <button className="grid h-8 w-8 place-items-center rounded-md border border-red-100 text-red-600 hover:bg-red-50" title="Move task to recycle bin" onClick={() => deleteTask(task.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </article>

      <TaskDetailsModal task={task} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </>
  );
}

function TaskDetailsModal({ task, open, onClose }: { task: Task; open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/25 p-4 backdrop-blur-sm animate-in fade-in duration-150" role="dialog" aria-modal="true" onClick={onClose}>
      <section
        className="max-h-[64vh] w-full max-w-md overflow-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/20 animate-in fade-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Task Details</p>
            <h2 className="mt-2 break-words text-xl font-semibold leading-7 text-zinc-950">title: {task.name}</h2>
          </div>
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950" title="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{task.description || 'No description provided.'}</p>
      </section>
    </div>
  );
}
