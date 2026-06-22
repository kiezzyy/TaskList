import { Archive, FolderKanban, History, LayoutDashboard, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { RecycleBinItem } from '../services/types';
import { formatDateTime } from '../utils/time';

export function ListSidebar({ onOpenHistory }: { onOpenHistory: () => void }) {
  const { lists, selectedListId, recycleBin, restoreTask } = useWorkspaceStore();
  const selectedList = lists.find((list) => list.id === selectedListId);
  const deletedTasks = useMemo(
    () => recycleBin.filter((item) => item.entity === 'task' && getRecycleListId(item.payload) === selectedListId),
    [recycleBin, selectedListId]
  );
  const totals = useMemo(
    () => ({
      tabs: lists.length,
      tasks: lists.reduce((count, list) => count + list.tasks.length, 0),
      deleted: deletedTasks.length
    }),
    [lists, deletedTasks]
  );

  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/20">
          <FolderKanban size={19} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">TaskList</h1>
          <p className="truncate text-xs text-zinc-500">Local workspace</p>
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 text-sm">
        <a className="flex items-center gap-2 rounded-2xl bg-zinc-950 px-3 py-2.5 font-medium text-white shadow-sm transition hover:-translate-y-0.5" href="#workspace">
          <LayoutDashboard size={16} /> Board
        </a>
        <button
          className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-zinc-600 transition-all duration-200 hover:bg-zinc-100 hover:font-semibold hover:text-zinc-950"
          onClick={onOpenHistory}
        >
          <History size={16} /> History
        </button>
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white/60 py-2.5 text-zinc-600">
          <div className="flex items-center justify-between gap-2 px-3">
            <span className="inline-flex items-center gap-2">
              <Archive size={16} /> Deleted Area
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500 shadow-sm">{totals.deleted}</span>
          </div>
          <div className="mt-2 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overflow-x-hidden px-3 pb-2 pr-2">
            {deletedTasks.map((item) => (
              <DeletedSidebarTask key={item.id} item={item} onRestore={() => restoreTask(item.entityId)} />
            ))}
            {deletedTasks.length === 0 ? <p className="px-1 py-1 text-xs text-zinc-400">No deleted tasks.</p> : null}
          </div>
        </div>
      </nav>

      <section className="mt-auto grid gap-3 border-t border-zinc-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Workspace Stats</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-semibold text-zinc-950">{totals.tabs}</p>
            <p className="text-xs text-zinc-500">Tabs</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-zinc-950">{totals.tasks}</p>
            <p className="text-xs text-zinc-500">Tasks</p>
          </div>
        </div>
        <p className="truncate text-xs text-zinc-500">{selectedList ? selectedList.name : 'No active tab'}</p>
      </section>
    </div>
  );
}

function DeletedSidebarTask({ item, onRestore }: { item: RecycleBinItem; onRestore: () => Promise<void> }) {
  const [restoring, setRestoring] = useState(false);

  async function restore() {
    setRestoring(true);
    try {
      await onRestore();
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className={`relative min-w-0 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm transition-all duration-200 ${restoring ? 'scale-[0.98] opacity-60' : 'scale-100 opacity-100'}`}>
      <p className="min-w-0 truncate text-xs font-medium text-zinc-800">{item.label}</p>
      <p className="mt-0.5 min-w-0 truncate text-[11px] text-zinc-400">{formatDateTime(item.deletedAt)}</p>
      <div className="mt-3 flex justify-end overflow-hidden">
        <button
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60"
          onClick={restore}
          disabled={restoring}
          title="Restore task"
        >
          <RotateCcw className={`transition-transform duration-200 ${restoring ? '-rotate-180' : 'rotate-0'}`} size={12} />
          Restore
        </button>
      </div>
    </div>
  );
}

function getRecycleListId(payload: string) {
  try {
    return (JSON.parse(payload) as { listId?: string }).listId ?? null;
  } catch {
    return null;
  }
}
