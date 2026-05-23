import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  createListSchema,
  createSubtaskSchema,
  createTaskSchema,
  updateListSchema,
  updateSubtaskSchema,
  updateTaskSchema
} from '../validators/taskSchemas.js';
import {
  createList,
  createSubtask,
  createTask,
  deleteList,
  deleteSubtask,
  deleteTask,
  getWorkspaceState,
  startTimer,
  stopTimer,
  updateList,
  updateSubtask,
  updateTask
} from '../services/taskService.js';

export const getState = asyncHandler(async (_request, response) => response.json(await getWorkspaceState()));

export const createTaskList = asyncHandler(async (request, response) => {
  response.status(201).json(await createList(createListSchema.parse(request.body)));
});

export const renameTaskList = asyncHandler(async (request, response) => {
  response.json(await updateList(routeId(request.params.id), updateListSchema.parse(request.body)));
});

export const removeTaskList = asyncHandler(async (request, response) => {
  await deleteList(routeId(request.params.id));
  response.status(204).end();
});

export const createNewTask = asyncHandler(async (request, response) => {
  response.status(201).json(await createTask(createTaskSchema.parse(request.body)));
});

export const editTask = asyncHandler(async (request, response) => {
  response.json(await updateTask(routeId(request.params.id), updateTaskSchema.parse(request.body)));
});

export const removeTask = asyncHandler(async (request, response) => {
  await deleteTask(routeId(request.params.id));
  response.status(204).end();
});

export const createNewSubtask = asyncHandler(async (request, response) => {
  response.status(201).json(await createSubtask(createSubtaskSchema.parse(request.body)));
});

export const editSubtask = asyncHandler(async (request, response) => {
  response.json(await updateSubtask(routeId(request.params.id), updateSubtaskSchema.parse(request.body)));
});

export const removeSubtask = asyncHandler(async (request, response) => {
  await deleteSubtask(routeId(request.params.id));
  response.status(204).end();
});

export const startTaskTimer = asyncHandler(async (request, response) => {
  response.status(201).json(await startTimer({ taskId: routeId(request.params.id) }));
});

export const stopTaskTimer = asyncHandler(async (request, response) => {
  response.json(await stopTimer({ taskId: routeId(request.params.id) }));
});

export const startSubtaskTimer = asyncHandler(async (request, response) => {
  response.status(201).json(await startTimer({ subtaskId: routeId(request.params.id) }));
});

export const stopSubtaskTimer = asyncHandler(async (request, response) => {
  response.json(await stopTimer({ subtaskId: routeId(request.params.id) }));
});

function routeId(value: string | string[] | undefined) {
  if (typeof value === 'string') {
    return value;
  }
  const error = new Error('Route ID must be a single string');
  Object.assign(error, { statusCode: 400 });
  throw error;
}
