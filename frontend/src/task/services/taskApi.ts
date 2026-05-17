import { apiRequest } from '../../shared/api';
import { Task, TaskList, WorkspaceState } from './types';

export const taskApi = {
  getState: () => apiRequest<WorkspaceState>('/state'),
  createList: (name: string) => apiRequest<TaskList>('/lists', post({ name })),
  renameList: (id: string, name: string) => apiRequest<TaskList>(`/lists/${id}`, patch({ name })),
  deleteList: (id: string) => apiRequest(`/lists/${id}`, { method: 'DELETE' }),
  createTask: (input: { listId: string; name: string; description?: string | null; statusId?: string }) =>
    apiRequest<Task>('/tasks', post(input)),
  updateTask: (id: string, input: Partial<{ listId: string; name: string; description: string | null; statusId: string }>) =>
    apiRequest<Task>(`/tasks/${id}`, patch(input)),
  deleteTask: (id: string) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
  startTimer: (id: string) => apiRequest(`/tasks/${id}/timer/start`, post({})),
  pauseTimer: (id: string) => apiRequest(`/tasks/${id}/timer/pause`, post({})),
  resumeTimer: (id: string) => apiRequest(`/tasks/${id}/timer/resume`, post({})),
  stopTimer: (id: string) => apiRequest(`/tasks/${id}/timer/stop`, post({}))
};

function post(body: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(body) };
}

function patch(body: unknown): RequestInit {
  return { method: 'PATCH', body: JSON.stringify(body) };
}
