import { FormEvent, useState } from 'react';
import { getStatusByName, useWorkspaceStore } from '../hooks/useWorkspaceStore';

export function TaskForm({ listId }: { listId: string }) {
  const { statuses, createTask } = useWorkspaceStore();
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
      statusId: getStatusByName(statuses, 'Not Started')?.id
    });
    setName('');
    setDescription('');
  }

  return (
    <form className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Task name"
        />
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
        />
        <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white">Add Task</button>
      </div>
    </form>
  );
}
