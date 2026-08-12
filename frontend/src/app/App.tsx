import { useEffect, useState } from 'react';
import { Download, RefreshCcw, X } from 'lucide-react';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { ListSidebar } from '../task/components/ListSidebar';
import { TaskBoard } from '../task/components/TaskBoard';
import { useWorkspaceStore } from '../task/hooks/useWorkspaceStore';
import { taskApi } from '../task/services/taskApi';
import type { ServerHealth } from '../task/services/types';
import { ActivityPanel } from '../workspace/recovery/ActivityPanel';
import { WorkspaceToolbar } from '../workspace/recovery/WorkspaceToolbar';
import { applyThemeMode, getInitialThemeMode } from '../shared/theme';
import type { ThemeMode } from '../shared/theme';
import { checkForReleaseUpdate, dismissReleaseUpdate, isDismissedRelease, type ReleaseUpdateState } from '../shared/releaseUpdates';

const uiPreferenceKeys = {
  historyOpen: 'tasklist-history-open'
} as const;

export function App() {
  const { load, loading, error } = useWorkspaceStore();
  const [historyOpen, setHistoryOpen] = useState(() => getStoredBoolean(uiPreferenceKeys.historyOpen, false));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [updateState, setUpdateState] = useState<ReleaseUpdateState | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let isMounted = true;

    async function refreshServerHealth() {
      try {
        const health = await taskApi.getHealth();
        if (!isMounted) {
          return;
        }

        setServerHealth(health);
      } catch {
        if (isMounted) {
          setServerHealth(null);
        }
      }
    }

    void refreshServerHealth();
    const intervalId = window.setInterval(refreshServerHealth, 60_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function refreshReleaseUpdate() {
      const nextUpdateState = await checkForReleaseUpdate();
      if (!isMounted) {
        return;
      }

      setUpdateState(nextUpdateState);
      if (!nextUpdateState) {
        setUpdateDialogOpen(false);
        return;
      }

      setUpdateDialogOpen(!isDismissedRelease(nextUpdateState.latestVersion));
    }

    void refreshReleaseUpdate();
    const intervalId = window.setInterval(refreshReleaseUpdate, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(uiPreferenceKeys.historyOpen, String(historyOpen));
  }, [historyOpen]);

  function openReleasePage() {
    if (!updateState) {
      return;
    }

    window.open(updateState.releaseUrl, '_blank', 'noopener,noreferrer');
  }

  function dismissUpdatePrompt() {
    if (updateState) {
      dismissReleaseUpdate(updateState.latestVersion);
    }
    setUpdateDialogOpen(false);
  }

  return (
    <>
      <WorkspaceLayout
        sidebar={<ListSidebar onOpenHistory={() => setHistoryOpen(true)} />}
        header={
          <WorkspaceToolbar
            themeMode={themeMode}
            onToggleTheme={() => setThemeMode((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
            serverHealth={serverHealth}
            updateAvailable={Boolean(updateState)}
            onRefreshUpdate={openReleasePage}
          />
        }
      >
        {updateState ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm shadow-amber-100/60">
            <div>
              <p className="font-semibold">Update available</p>
              <p className="text-amber-900/80">
                TaskList {updateState.latestVersion} is ready. Open the release page to get the latest desktop installer.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-950 transition hover:bg-amber-100"
                onClick={dismissUpdatePrompt}
                type="button"
              >
                <X size={15} />
                Later
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-amber-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-amber-900"
                onClick={openReleasePage}
                type="button"
              >
                <Download size={15} />
                Open release
              </button>
            </div>
          </div>
        ) : null}
        {loading ? <div className="rounded-md bg-white p-6 text-sm text-zinc-500">Loading workspace...</div> : null}
        {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <TaskBoard />
        <ActivityPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
      </WorkspaceLayout>
      {updateDialogOpen && updateState ? (
        <ReleaseUpdateDialog
          releaseState={updateState}
          onClose={dismissUpdatePrompt}
          onOpenRelease={openReleasePage}
        />
      ) : null}
    </>
  );
}

function ReleaseUpdateDialog({
  releaseState,
  onClose,
  onOpenRelease
}: {
  releaseState: ReleaseUpdateState;
  onClose: () => void;
  onOpenRelease: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-150" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="mx-auto mt-10 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/30 animate-in zoom-in-95 duration-200" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Update ready</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-950">TaskList {releaseState.latestVersion}</h2>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950" onClick={onClose} title="Close update prompt" type="button">
            <X size={16} />
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          A newer release is available for desktop. Open the release page to download the latest installer, then reopen the app after installing.
        </p>
        <div className="mt-4 grid gap-2 rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-500">
          <p>
            Current version: <span className="font-medium text-zinc-700">{releaseState.currentVersion}</span>
          </p>
          <p>
            Latest version: <span className="font-medium text-zinc-700">{releaseState.latestVersion}</span>
          </p>
          {releaseState.publishedAt ? (
            <p>
              Published: <span className="font-medium text-zinc-700">{new Date(releaseState.publishedAt).toLocaleString()}</span>
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50" onClick={onClose} type="button">
            Later
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-zinc-800" onClick={onOpenRelease} type="button">
            <Download size={15} />
            Open release
          </button>
        </div>
      </div>
    </div>
  );
}

function getStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(key);
  if (storedValue === 'true') {
    return true;
  }

  if (storedValue === 'false') {
    return false;
  }

  return fallback;
}
