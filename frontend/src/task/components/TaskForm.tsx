import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import { getPriorityByName, getStatusByName, useWorkspaceStore } from '../hooks/useWorkspaceStore';

export function TaskForm({ listId }: { listId: string }) {
  const { priorities, statuses, createTask } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    await createTask({
      listId,
      name: name.trim(),
      description: description.trim() || null,
      statusId: getStatusByName(statuses, 'To Do')?.id,
      priorityId: getPriorityByName(priorities, 'Medium')?.id
    });
    setName('');
    setDescription('');
  }

  return (
    <form className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/70" onSubmit={submit}>
      <div className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
        <input
          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Task title"
        />
        <input
          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
        />
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
          <Plus size={16} /> Add
        </button>
      </div>
    </form>
  );
}
