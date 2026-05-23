import { create } from 'zustand';
import { taskApi } from '../services/taskApi';
import { Subtask, Task, TaskList, TaskPriority, TaskStatus, WorkspaceState } from '../services/types';

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
  createSubtask: (input: { taskId: string; name: string; description?: string | null; statusId?: string }) => Promise<void>;
  updateSubtask: (id: string, input: Partial<{ name: string; description: string | null; statusId: string }>) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  startTimer: (id: string) => Promise<void>;
  pauseTimer: (id: string) => Promise<void>;
  resumeTimer: (id: string) => Promise<void>;
  stopTimer: (id: string) => Promise<void>;
  startSubtaskTimer: (id: string) => Promise<void>;
  pauseSubtaskTimer: (id: string) => Promise<void>;
  resumeSubtaskTimer: (id: string) => Promise<void>;
  stopSubtaskTimer: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  statuses: [],
  priorities: [],
  lists: [],
  history: [],
  recycleBin: [],
  selectedListId: null,
  statusFilter: 'all',
  priorityFilter: 'all',
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
  setPriorityFilter: (priorityId) => set({ priorityFilter: priorityId }),
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
  createSubtask: async (input) => {
    const subtask = await taskApi.createSubtask(input);
    set((state) => ({ lists: addSubtaskToTask(state.lists, subtask) }));
  },
  updateSubtask: async (id, input) => {
    const subtask = await taskApi.updateSubtask(id, input);
    set((state) => ({ lists: updateSubtaskInLists(state.lists, subtask) }));
  },
  deleteSubtask: async (id) => {
    await taskApi.deleteSubtask(id);
    await get().load();
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
  },
  startSubtaskTimer: async (id) => {
    await taskApi.startSubtaskTimer(id);
    await get().load();
  },
  pauseSubtaskTimer: async (id) => {
    await taskApi.pauseSubtaskTimer(id);
    await get().load();
  },
  resumeSubtaskTimer: async (id) => {
    await taskApi.resumeSubtaskTimer(id);
    await get().load();
  },
  stopSubtaskTimer: async (id) => {
    await taskApi.stopSubtaskTimer(id);
    await get().load();
  }
}));

export function getVisibleTasks(lists: TaskList[], selectedListId: string | null, statusFilter: string, priorityFilter: string, searchQuery: string) {
  const list = lists.find((item) => item.id === selectedListId);
  const query = searchQuery.trim().toLowerCase();
  return (list?.tasks ?? []).filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.statusId === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priorityId === priorityFilter;
    const matchesSearch =
      !query ||
      task.name.toLowerCase().includes(query) ||
      (task.description ?? '').toLowerCase().includes(query) ||
      task.subtasks.some((subtask) => subtask.name.toLowerCase().includes(query));
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

function addSubtaskToTask(lists: TaskList[], subtask: Subtask) {
  return lists.map((list) => ({
    ...list,
    tasks: list.tasks.map((task) => (task.id === subtask.taskId ? { ...task, subtasks: [subtask, ...task.subtasks] } : task))
  }));
}

function updateSubtaskInLists(lists: TaskList[], subtask: Subtask) {
  return lists.map((list) => ({
    ...list,
    tasks: list.tasks.map((task) => ({
      ...task,
      subtasks: task.subtasks.map((item) => (item.id === subtask.id ? { ...item, ...subtask } : item))
    }))
  }));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}
