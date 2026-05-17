import { Download, Upload } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { downloadWorkspaceExport } from '../export/exportApi';
import { analyzeWorkspace, importWorkspace, parseWorkspaceFile } from '../import/importApi';
import { useWorkspaceStore } from '../../task/hooks/useWorkspaceStore';

export function WorkspaceToolbar() {
  const load = useWorkspaceStore((state) => state.load);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const mode = normalizedChoice;
      const summary = await importWorkspace(payload, mode);
      await load();
      setMessage(`Import complete: ${summary.taskLists} lists, ${summary.tasks} tasks, ${summary.sessions} sessions.`);
    } catch (error) {
      setMessage(getMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Personal Workspace</h2>
        {message ? <p className="text-sm text-zinc-600">{message}</p> : <p className="text-sm text-zinc-500">Your data stays local in SQL storage.</p>}
      </div>
      <div className="flex gap-2">
        <button className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50" onClick={exportWorkspace} disabled={busy}>
          <Download size={16} /> Export
        </button>
        <button className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-60" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Upload size={16} /> Import
        </button>
        <input ref={inputRef} className="hidden" type="file" accept="application/json,.json" onChange={handleImport} />
      </div>
    </div>
  );
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Workspace operation failed.';
}
