import { create } from 'zustand';
import { taskApi } from '../services/taskApi';
import { Task, TaskList, TaskStatus, WorkspaceState } from '../services/types';

interface WorkspaceStore extends WorkspaceState {
  selectedListId: string | null;
  statusFilter: string;
  searchQuery: string;
  error: string | null;
  loading: boolean;
  load: () => Promise<void>;
  setSelectedListId: (id: string | null) => void;
  setStatusFilter: (statusId: string) => void;
  setSearchQuery: (query: string) => void;
  createList: (name: string) => Promise<void>;
  renameList: (id: string, name: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  createTask: (input: { listId: string; name: string; description?: string | null; statusId?: string }) => Promise<void>;
  updateTask: (id: string, input: Partial<{ name: string; description: string | null; statusId: string }>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  startTimer: (id: string) => Promise<void>;
  pauseTimer: (id: string) => Promise<void>;
  resumeTimer: (id: string) => Promise<void>;
  stopTimer: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  statuses: [],
  lists: [],
  selectedListId: null,
  statusFilter: 'all',
  searchQuery: '',
  error: null,
  loading: false,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const state = await taskApi.getState();
      set((current) => ({
        ...state,
        selectedListId: current.selectedListId ?? state.lists[0]?.id ?? null,
        loading: false
      }));
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  setSelectedListId: (id) => set({ selectedListId: id }),
  setStatusFilter: (statusId) => set({ statusFilter: statusId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  createList: async (name) => {
    const list = await taskApi.createList(name);
    set((state) => ({ lists: [{ ...list, tasks: [] }, ...state.lists], selectedListId: list.id }));
  },
  renameList: async (id, name) => {
    const updated = await taskApi.renameList(id, name);
    set((state) => ({ lists: state.lists.map((list) => (list.id === id ? { ...list, ...updated } : list)) }));
  },
  deleteList: async (id) => {
    await taskApi.deleteList(id);
    set((state) => {
      const lists = state.lists.filter((list) => list.id !== id);
      return { lists, selectedListId: lists[0]?.id ?? null };
    });
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
    set((state) => ({
      lists: state.lists.map((list) => ({ ...list, tasks: list.tasks.filter((task) => task.id !== id) }))
    }));
  },
  startTimer: async (id) => {
    await taskApi.startTimer(id);
    await get().load();
  },
  pauseTimer: async (id) => {
    await taskApi.pauseTimer(id);
    await get().load();
  },
  resumeTimer: async (id) => {
    await taskApi.resumeTimer(id);
    await get().load();
  },
  stopTimer: async (id) => {
    await taskApi.stopTimer(id);
    await get().load();
  }
}));

export function getVisibleTasks(lists: TaskList[], selectedListId: string | null, statusFilter: string, searchQuery: string) {
  const list = lists.find((item) => item.id === selectedListId);
  const query = searchQuery.trim().toLowerCase();
  return (list?.tasks ?? []).filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.statusId === statusFilter;
    const matchesSearch =
      !query ||
      task.name.toLowerCase().includes(query) ||
      (task.description ?? '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });
}

export function getStatusByName(statuses: TaskStatus[], name: string) {
  return statuses.find((status) => status.name === name);
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
