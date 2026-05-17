import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Task } from '../services/types';
import { formatDateTime } from '../utils/time';
import { SessionTimeline } from './SessionTimeline';
import { TimerControls } from './TimerControls';

export function TaskCard({ task }: { task: Task }) {
  const { statuses, updateTask, deleteTask } = useWorkspaceStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? '');

  async function save() {
    await updateTask(task.id, { name: name.trim(), description: description.trim() || null });
    setEditing(false);
  }

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
              <textarea className="min-h-24 w-full rounded border border-zinc-300 px-3 py-2 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          ) : (
            <>
              <h3 className="break-words text-base font-semibold">{task.name}</h3>
              {task.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{task.description}</p> : null}
            </>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            Created {formatDateTime(task.createdAt)} · Updated {formatDateTime(task.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
            value={task.statusId}
            onChange={(event) => updateTask(task.id, { statusId: event.target.value })}
          >
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          <TimerControls task={task} />
          {editing ? (
            <>
              <button className="grid h-8 w-8 place-items-center rounded-md bg-zinc-950 text-white" title="Save task" onClick={save}>
                <Check size={15} />
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-300" title="Cancel edit" onClick={() => setEditing(false)}>
                <X size={15} />
              </button>
            </>
          ) : (
            <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-300" title="Edit task" onClick={() => setEditing(true)}>
              <Pencil size={15} />
            </button>
          )}
          <button className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-600" title="Delete task" onClick={() => deleteTask(task.id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="mt-4 border-t border-zinc-100 pt-3">
        <SessionTimeline task={task} />
      </div>
    </article>
  );
}
