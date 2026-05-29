import { apiRequest } from '../../shared/api';
import { apiRoutes } from '../../shared/apiRoutes';
import { Task, TaskList, WorkspaceState } from './types';

export const taskApi = {
  getState: () => apiRequest<WorkspaceState>(apiRoutes.state),
  createList: (name: string) => apiRequest<TaskList>(apiRoutes.lists, post({ name })),
  renameList: (id: string, name: string) => apiRequest<TaskList>(apiRoutes.list(id), patch({ name })),
  deleteList: (id: string) => apiRequest(apiRoutes.list(id), { method: 'DELETE' }),
  createTask: (input: { listId: string; name: string; description?: string | null; statusId?: string; priorityId?: string }) =>
    apiRequest<Task>(apiRoutes.tasks, post(input)),
  updateTask: (id: string, input: Partial<{ name: string; description: string | null; statusId: string; priorityId: string }>) =>
    apiRequest<Task>(apiRoutes.task(id), patch(input)),
  deleteTask: (id: string) => apiRequest(apiRoutes.task(id), { method: 'DELETE' }),
  restoreTask: (id: string) => apiRequest<Task>(apiRoutes.restoreTask(id), post({})),
  startTimer: (id: string) => apiRequest(apiRoutes.startTaskTimer(id), post({})),
  stopTimer: (id: string) => apiRequest(apiRoutes.stopTaskTimer(id), post({}))
};

function post(body: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(body) };
}

function patch(body: unknown): RequestInit {
  return { method: 'PATCH', body: JSON.stringify(body) };
}
