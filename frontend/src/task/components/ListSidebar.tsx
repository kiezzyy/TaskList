import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';

export function ListSidebar() {
  const { lists, selectedListId, setSelectedListId, createList, renameList, deleteList } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    await createList(name.trim());
    setName('');
  }

  async function saveRename(id: string) {
    if (editingName.trim()) {
      await renameList(id, editingName.trim());
    }
    setEditingId(null);
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold">TaskList</h1>
      </div>

      <form className="flex gap-2" onSubmit={submit}>
        <input
          className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New project"
        />
        <button className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-white" title="Create list">
          <Plus size={18} />
        </button>
      </form>

      <div className="space-y-2">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`rounded-md border p-2 ${
              selectedListId === list.id ? 'border-zinc-950 bg-zinc-50' : 'border-zinc-200 bg-white'
            }`}
          >
            {editingId === list.id ? (
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <button className="grid h-8 w-8 place-items-center rounded bg-zinc-950 text-white" onClick={() => saveRename(list.id)} title="Save">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <button className="w-full text-left" onClick={() => setSelectedListId(list.id)}>
                <span className="block truncate text-sm font-medium">{list.name}</span>
                <span className="text-xs text-zinc-500">{list.tasks.length} tasks</span>
              </button>
            )}
            <div className="mt-2 flex gap-1">
              <button
                className="grid h-8 w-8 place-items-center rounded hover:bg-zinc-100"
                title="Rename list"
                onClick={() => {
                  setEditingId(list.id);
                  setEditingName(list.name);
                }}
              >
                <Pencil size={15} />
              </button>
              <button
                className="grid h-8 w-8 place-items-center rounded text-red-600 hover:bg-red-50"
                title="Delete list"
                onClick={() => deleteList(list.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
