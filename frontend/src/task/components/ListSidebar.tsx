import { BarChart3, Check, Clock3, FolderKanban, History, LayoutDashboard, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { formatDuration } from '../utils/time';

export function ListSidebar() {
  const { lists, selectedListId, setSelectedListId, createList, renameList, deleteList } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const totals = useMemo(
    () => ({
      tasks: lists.reduce((count, list) => count + list.tasks.length, 0),
      seconds: lists.reduce((count, list) => count + list.tasks.reduce((taskTotal, task) => taskTotal + task.totalDurationSeconds, 0), 0)
    }),
    [lists]
  );

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
    <div className="flex h-full flex-col gap-5 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-white">
          <FolderKanban size={19} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-normal">TaskList</h1>
          <p className="text-xs text-zinc-500">Local workspace</p>
        </div>
      </div>

      <nav className="grid gap-1 text-sm">
        <a className="flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-white" href="#workspace">
          <LayoutDashboard size={16} /> Board
        </a>
        <a className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100" href="#activity">
          <History size={16} /> History
        </a>
        <div className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-600">
          <Clock3 size={16} /> {formatDuration(totals.seconds)}
        </div>
      </nav>

      <section className="rounded-lg border border-zinc-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <BarChart3 size={16} /> Workspace Stats
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-zinc-50 p-2">
            <p className="text-lg font-semibold">{lists.length}</p>
            <p className="text-xs text-zinc-500">Tabs</p>
          </div>
          <div className="rounded-md bg-zinc-50 p-2">
            <p className="text-lg font-semibold">{totals.tasks}</p>
            <p className="text-xs text-zinc-500">Tasks</p>
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Tabs</p>
        </div>
        <form className="mb-3 flex gap-2" onSubmit={submit}>
          <input
            className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New tab"
          />
          <button className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-white" title="Create tab">
            <Plus size={18} />
          </button>
        </form>

        <div className="max-h-[38vh] space-y-2 overflow-auto pr-1 lg:max-h-none">
          {lists.map((list) => (
            <div key={list.id} className={`rounded-lg border p-2 transition ${selectedListId === list.id ? 'border-zinc-900 bg-white shadow-sm' : 'border-transparent hover:bg-zinc-100'}`}>
              {editingId === list.id ? (
                <div className="flex gap-2">
                  <input className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                  <button className="grid h-8 w-8 place-items-center rounded bg-zinc-950 text-white" onClick={() => saveRename(list.id)} title="Save tab">
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
                  className="grid h-8 w-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100"
                  title="Rename tab"
                  onClick={() => {
                    setEditingId(list.id);
                    setEditingName(list.name);
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button className="grid h-8 w-8 place-items-center rounded text-red-600 hover:bg-red-50" title="Delete tab" onClick={() => deleteList(list.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
