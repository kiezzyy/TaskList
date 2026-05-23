import { Check, Download, FolderOpen, Pencil, Plus, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { useWorkspaceStore } from '../../task/hooks/useWorkspaceStore';
import { downloadWorkspaceExport } from '../export/exportApi';
import { analyzeWorkspace, importWorkspace, parseWorkspaceFile } from '../import/importApi';

export function WorkspaceToolbar() {
  const { lists, selectedListId, setSelectedListId, createList, renameList, load } = useWorkspaceStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  async function exportWorkspace() {
    setBusy(true);
    setMessage(null);
    try {
      await downloadWorkspaceExport();
      setMessage('Workspace export created.');
    } catch (error) {
      setMessage(getMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setBusy(true);
    setMessage('Validating workspace backup...');
    try {
      const payload = await parseWorkspaceFile(file);
      const analysis = await analyzeWorkspace(payload);
      if (!analysis.valid) {
        setMessage(`${analysis.errors?.join(' ')} ${analysis.guidance ?? ''}`.trim());
        return;
      }
      const choice = window.prompt('Type "replace" to restore only this backup, "merge" to add it to the current workspace, or "cancel".', 'merge');
      if (choice === null || choice.toLowerCase() === 'cancel') {
        setMessage('Import canceled.');
        return;
      }
      const normalizedChoice = choice.toLowerCase();
      if (normalizedChoice !== 'replace' && normalizedChoice !== 'merge') {
        setMessage('Import canceled. Choose merge or replace when importing a workspace.');
        return;
      }
      const summary = await importWorkspace(payload, normalizedChoice);
      await load();
      setMessage(`Import complete: ${summary.taskLists} tabs, ${summary.tasks} tasks, ${summary.subtasks} subtasks, ${summary.sessions} sessions.`);
    } catch (error) {
      setMessage(getMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function addTab(event: FormEvent) {
    event.preventDefault();
    if (!newTabName.trim()) {
      return;
    }
    await createList(newTabName.trim());
    setNewTabName('');
  }

  async function saveTabName(id: string) {
    if (editingName.trim()) {
      await renameList(id, editingName.trim());
    }
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white shadow-sm">
            <FolderOpen size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold">Personal Workspace</h2>
            <p className="text-xs text-zinc-500">{message ?? 'SQLite persistence, JSON backups, and local-first task tracking.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50" onClick={exportWorkspace} disabled={busy}>
            <Download size={16} /> Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-60" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload size={16} /> Import
          </button>
          <input ref={inputRef} className="hidden" type="file" accept="application/json,.json" onChange={handleImport} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {lists.map((list) =>
          editingId === list.id ? (
            <div key={list.id} className="flex min-w-48 items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1">
              <input className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
              <button className="grid h-7 w-7 place-items-center rounded-full bg-zinc-950 text-white" title="Save tab name" onClick={() => saveTabName(list.id)}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              key={list.id}
              className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                selectedListId === list.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
              }`}
              onClick={() => setSelectedListId(list.id)}
            >
              <span className="max-w-44 truncate">{list.name}</span>
              <span className={selectedListId === list.id ? 'text-zinc-300' : 'text-zinc-400'}>{list.tasks.length}</span>
              <span
                className="grid h-5 w-5 place-items-center rounded-full opacity-70 hover:bg-white/20"
                title="Rename tab"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingId(list.id);
                  setEditingName(list.name);
                }}
              >
                <Pencil size={12} />
              </span>
            </button>
          )
        )}
        <form className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1" onSubmit={addTab}>
          <input className="w-28 bg-transparent px-2 text-sm outline-none sm:w-36" value={newTabName} onChange={(event) => setNewTabName(event.target.value)} placeholder="New tab" />
          <button className="grid h-7 w-7 place-items-center rounded-full bg-zinc-950 text-white" title="Create tab">
            <Plus size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Workspace operation failed.';
}
