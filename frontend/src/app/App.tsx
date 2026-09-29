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

      setUpdateState(nextUpdateState && !isDismissedRelease(nextUpdateState.latestVersion) ? nextUpdateState : null);
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
    setUpdateState(null);
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
    </>
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
