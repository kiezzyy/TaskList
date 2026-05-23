import { Check, ChevronDown, ChevronRight, Clock3, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { getStatusByName, useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Subtask, Task } from '../services/types';
import { formatDateTime, formatDuration } from '../utils/time';
import { SessionTimeline } from './SessionTimeline';
import { TimerControls } from './TimerControls';

export function TaskCard({ task, onDragStart }: { task: Task; onDragStart: (taskId: string) => void }) {
  const { priorities, statuses, updateTask, deleteTask, createSubtask } = useWorkspaceStore();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? '');
  const [subtaskName, setSubtaskName] = useState('');

  async function save() {
    await updateTask(task.id, { name: name.trim(), description: description.trim() || null });
    setEditing(false);
  }

  async function addSubtask(event: FormEvent) {
    event.preventDefault();
    if (!subtaskName.trim()) {
      return;
    }
    await createSubtask({
      taskId: task.id,
      name: subtaskName.trim(),
      statusId: getStatusByName(statuses, 'To Do')?.id
    });
    setSubtaskName('');
    setExpanded(true);
  }

  return (
    <article
      className="group rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/60 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
      draggable={!editing}
      onDragStart={() => onDragStart(task.id)}
    >
      <div className="flex flex-col gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-1 shrink-0 text-zinc-300 transition group-hover:text-zinc-500" size={16} />
            <button className="grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-zinc-100" title="Toggle details" onClick={() => setExpanded((value) => !value)}>
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {editing ? (
              <input className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
            ) : (
              <h3 className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-zinc-900">{task.name}</h3>
            )}
          </div>

          {editing ? (
            <textarea
              className="mt-2 min-h-20 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          ) : task.description ? (
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-zinc-600">{task.description}</p>
          ) : null}

          <div className="mt-3 h-1.5 rounded-full bg-zinc-100">
            <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-1">
            <Clock3 size={13} /> {formatDuration(task.totalDurationSeconds)}
          </span>
          <span>{task.progress}%</span>
          <span>Updated {formatDateTime(task.updatedAt)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs" value={task.statusId} onChange={(event) => updateTask(task.id, { statusId: event.target.value })}>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          <select className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs" value={task.priorityId} onChange={(event) => updateTask(task.id, { priorityId: event.target.value })}>
            {priorities.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.name}
              </option>
            ))}
          </select>
          <TimerControls item={task} target="task" />
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

      {expanded ? (
        <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-3">
          <p className="text-xs text-zinc-500">Created {formatDateTime(task.createdAt)}</p>
          <form className="flex gap-2" onSubmit={addSubtask}>
            <input
              className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              value={subtaskName}
              onChange={(event) => setSubtaskName(event.target.value)}
              placeholder="New subtask"
            />
            <button className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-white" title="Add subtask">
              <Plus size={16} />
            </button>
          </form>
          {task.subtasks.map((subtask) => (
            <SubtaskRow key={subtask.id} subtask={subtask} />
          ))}
          <SessionTimeline sessions={task.sessions} />
        </div>
      ) : null}
    </article>
  );
}

function SubtaskRow({ subtask }: { subtask: Subtask }) {
  const { statuses, updateSubtask, deleteSubtask } = useWorkspaceStore();

  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium">{subtask.name}</p>
          {subtask.description ? <p className="text-xs text-zinc-500">{subtask.description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded-md border border-zinc-200 px-2 py-1.5 text-sm" value={subtask.statusId} onChange={(event) => updateSubtask(subtask.id, { statusId: event.target.value })}>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          <TimerControls item={subtask} target="subtask" />
          <button className="grid h-8 w-8 place-items-center rounded-md border border-red-100 text-red-600 hover:bg-red-50" title="Move subtask to recycle bin" onClick={() => deleteSubtask(subtask.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <SessionTimeline sessions={subtask.sessions} />
      </div>
    </div>
  );
}
