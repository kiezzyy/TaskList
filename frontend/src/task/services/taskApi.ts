import { apiRequest } from '../../shared/api';
import { Task, TaskList, WorkspaceState } from './types';

export const taskApi = {
  getState: () => apiRequest<WorkspaceState>('/state'),
  createList: (name: string) => apiRequest<TaskList>('/lists', post({ name })),
  renameList: (id: string, name: string) => apiRequest<TaskList>(`/lists/${id}`, patch({ name })),
  deleteList: (id: string) => apiRequest(`/lists/${id}`, { method: 'DELETE' }),
  createTask: (input: { listId: string; name: string; description?: string | null; statusId?: string; priorityId?: string }) =>
    apiRequest<Task>('/tasks', post(input)),
  updateTask: (id: string, input: Partial<{ name: string; description: string | null; statusId: string; priorityId: string }>) =>
    apiRequest<Task>(`/tasks/${id}`, patch(input)),
  deleteTask: (id: string) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
  restoreTask: (id: string) => apiRequest<Task>(`/tasks/${id}/restore`, post({})),
  startTimer: (id: string) => apiRequest(`/tasks/${id}/timer/start`, post({})),
  stopTimer: (id: string) => apiRequest(`/tasks/${id}/timer/stop`, post({}))
};

function post(body: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(body) };
}

function patch(body: unknown): RequestInit {
  return { method: 'PATCH', body: JSON.stringify(body) };
}
