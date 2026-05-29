import { FormEvent, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { taskPriorityNames, taskStatusNames } from '../../shared/applicationConstants';
import { getPriorityByName, getStatusByName, useWorkspaceStore } from '../hooks/useWorkspaceStore';

export function TaskForm({ listId, open, onClose }: { listId: string; open: boolean; onClose: () => void }) {
  const { priorities, statuses, createTask } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priorityId, setPriorityId] = useState('');

  useEffect(() => {
    if (open) {
      setStatusId(getStatusByName(statuses, taskStatusNames.todo)?.id ?? statuses[0]?.id ?? '');
      setPriorityId(getPriorityByName(priorities, taskPriorityNames.medium)?.id ?? priorities[0]?.id ?? '');
    }
  }, [open, priorities, statuses]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    await createTask({
      listId,
      name: name.trim(),
      description: description.trim() || null,
      statusId: statusId || undefined,
      priorityId: priorityId || undefined
    });
    setName('');
    setDescription('');
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/25 p-4 backdrop-blur-sm animate-in fade-in duration-150" role="dialog" aria-modal="true">
      <form className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/20 animate-in fade-in zoom-in-95 duration-200" onSubmit={submit}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">New Task</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">Add task details</h2>
          </div>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950" title="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            Title
            <input
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Task title"
              autoFocus
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            Description
            <textarea
              className="min-h-24 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context, notes, or acceptance details"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-50" onClick={onClose}>
            Cancel
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-zinc-800">
            <Plus size={16} /> Add Task
          </button>
        </div>
      </form>
    </div>
  );
}
