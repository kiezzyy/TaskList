import { create } from 'zustand';
import { taskApi } from '../services/taskApi';
import { Task, TaskList, TaskPriority, TaskStatus, WorkspaceState } from '../services/types';

interface WorkspaceStore extends WorkspaceState {
  selectedListId: string | null;
  statusFilter: string;
  priorityFilter: string;
  searchQuery: string;
  error: string | null;
  loading: boolean;
  load: () => Promise<void>;
  setSelectedListId: (id: string | null) => void;
  setStatusFilter: (statusId: string) => void;
  setPriorityFilter: (priorityId: string) => void;
  setSearchQuery: (query: string) => void;
  createList: (name: string) => Promise<void>;
  renameList: (id: string, name: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  createTask: (input: { listId: string; name: string; description?: string | null; statusId?: string; priorityId?: string }) => Promise<void>;
  updateTask: (id: string, input: Partial<{ name: string; description: string | null; statusId: string; priorityId: string }>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  startTimer: (id: string) => Promise<void>;
  stopTimer: (id: string) => Promise<void>;
}

const workspacePreferenceKeys = {
  selectedListId: 'tasklist-selected-list-id',
  searchQuery: 'tasklist-search-query',
  statusFilter: 'tasklist-status-filter',
  priorityFilter: 'tasklist-priority-filter'
} as const;

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  statuses: [],
  priorities: [],
  lists: [],
  history: [],
  recycleBin: [],
  selectedListId: readStoredValue(workspacePreferenceKeys.selectedListId),
  statusFilter: readStoredValue(workspacePreferenceKeys.statusFilter) ?? 'all',
  priorityFilter: readStoredValue(workspacePreferenceKeys.priorityFilter) ?? 'all',
  searchQuery: readStoredValue(workspacePreferenceKeys.searchQuery) ?? '',
  error: null,
  loading: false,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const state = await taskApi.getState();
      const selectedListId = pickSelectedListId(state.lists, get().selectedListId, readStoredValue(workspacePreferenceKeys.selectedListId));
      writeStoredValue(workspacePreferenceKeys.selectedListId, selectedListId);
      set({
        ...state,
        selectedListId,
        loading: false
      });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  setSelectedListId: (id) => {
    writeStoredValue(workspacePreferenceKeys.selectedListId, id);
    set({ selectedListId: id });
  },
  setStatusFilter: (statusId) => {
    writeStoredValue(workspacePreferenceKeys.statusFilter, statusId);
    set({ statusFilter: statusId });
  },
  setPriorityFilter: (priorityId) => {
    writeStoredValue(workspacePreferenceKeys.priorityFilter, priorityId);
    set({ priorityFilter: priorityId });
  },
  setSearchQuery: (query) => {
    writeStoredValue(workspacePreferenceKeys.searchQuery, query);
    set({ searchQuery: query });
  },
  createList: async (name) => {
    const list = await taskApi.createList(name);
    set((state) => ({ lists: [{ ...list, tasks: [] }, ...state.lists], selectedListId: list.id }));
    writeStoredValue(workspacePreferenceKeys.selectedListId, list.id);
  },
  renameList: async (id, name) => {
    const updated = await taskApi.renameList(id, name);
    set((state) => ({ lists: state.lists.map((list) => (list.id === id ? { ...list, ...updated } : list)) }));
  },
  deleteList: async (id) => {
    await taskApi.deleteList(id);
    await get().load();
  },
  createTask: async (input) => {
    const task = await taskApi.createTask(input);
    set((state) => ({ lists: addTaskToList(state.lists, task) }));
  },
  updateTask: async (id, input) => {
    const task = await taskApi.updateTask(id, input);
    set((state) => ({ lists: updateTaskInLists(state.lists, task) }));
  },
  deleteTask: async (id) => {
    await taskApi.deleteTask(id);
    await get().load();
  },
  restoreTask: async (id) => {
    await taskApi.restoreTask(id);
    await get().load();
  },
  startTimer: async (id) => {
    await taskApi.startTimer(id);
    await get().load();
  },
  stopTimer: async (id) => {
    await taskApi.stopTimer(id);
    await get().load();
  }
}));

export function getVisibleTasks(lists: TaskList[], selectedListId: string | null, statusFilter: string, priorityFilter: string, searchQuery: string) {
  const list = lists.find((item) => item.id === selectedListId);
  const query = searchQuery.trim().toLowerCase();
  return (list?.tasks ?? []).filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.statusId === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priorityId === priorityFilter;
    const matchesSearch = !query || task.name.toLowerCase().includes(query) || (task.description ?? '').toLowerCase().includes(query);
    return matchesStatus && matchesPriority && matchesSearch;
  });
}

export function getStatusByName(statuses: TaskStatus[], name: string) {
  return statuses.find((status) => status.name === name);
}

export function getPriorityByName(priorities: TaskPriority[], name: string) {
  return priorities.find((priority) => priority.name === name);
}

function addTaskToList(lists: TaskList[], task: Task) {
  return lists.map((list) => (list.id === task.listId ? { ...list, tasks: [task, ...list.tasks] } : list));
}

function updateTaskInLists(lists: TaskList[], task: Task) {
  return lists.map((list) => ({
    ...list,
    tasks: list.id === task.listId ? list.tasks.map((item) => (item.id === task.id ? task : item)) : list.tasks
  }));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function readStoredValue(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so the app keeps working.
  }
}

function pickSelectedListId(lists: TaskList[], currentSelection: string | null, storedSelection: string | null) {
  if (currentSelection && lists.some((list) => list.id === currentSelection)) {
    return currentSelection;
  }

  if (storedSelection && lists.some((list) => list.id === storedSelection)) {
    return storedSelection;
  }

  return lists[0]?.id ?? null;
}
