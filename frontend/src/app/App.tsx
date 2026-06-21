import { useEffect, useState } from 'react';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { ListSidebar } from '../task/components/ListSidebar';
import { TaskBoard } from '../task/components/TaskBoard';
import { useWorkspaceStore } from '../task/hooks/useWorkspaceStore';
import { ActivityPanel } from '../workspace/recovery/ActivityPanel';
import { WorkspaceToolbar } from '../workspace/recovery/WorkspaceToolbar';
import { applyThemeMode, getInitialThemeMode } from '../shared/theme';
import type { ThemeMode } from '../shared/theme';

const uiPreferenceKeys = {
  historyOpen: 'tasklist-history-open'
} as const;

export function App() {
  const { load, loading, error } = useWorkspaceStore();
  const [historyOpen, setHistoryOpen] = useState(() => getStoredBoolean(uiPreferenceKeys.historyOpen, false));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(uiPreferenceKeys.historyOpen, String(historyOpen));
  }, [historyOpen]);

  return (
    <WorkspaceLayout
      sidebar={<ListSidebar onOpenHistory={() => setHistoryOpen(true)} />}
      header={<WorkspaceToolbar themeMode={themeMode} onToggleTheme={() => setThemeMode((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))} />}
    >
      {loading ? <div className="rounded-md bg-white p-6 text-sm text-zinc-500">Loading workspace...</div> : null}
      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <TaskBoard />
      <ActivityPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </WorkspaceLayout>
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
