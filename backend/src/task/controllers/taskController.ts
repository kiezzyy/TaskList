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
  restoreTask,
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
  response.json(await updateList(parseRouteId(request.params.id), updateListSchema.parse(request.body)));
});

export const removeTaskList = asyncHandler(async (request, response) => {
  await deleteList(parseRouteId(request.params.id));
  response.status(204).end();
});

export const createNewTask = asyncHandler(async (request, response) => {
  response.status(201).json(await createTask(createTaskSchema.parse(request.body)));
});

export const editTask = asyncHandler(async (request, response) => {
  response.json(await updateTask(parseRouteId(request.params.id), updateTaskSchema.parse(request.body)));
});

export const removeTask = asyncHandler(async (request, response) => {
  await deleteTask(parseRouteId(request.params.id));
  response.status(204).end();
});

export const restoreDeletedTask = asyncHandler(async (request, response) => {
  response.json(await restoreTask(parseRouteId(request.params.id)));
});

export const createNewSubtask = asyncHandler(async (request, response) => {
  response.status(201).json(await createSubtask(createSubtaskSchema.parse(request.body)));
});

export const editSubtask = asyncHandler(async (request, response) => {
  response.json(await updateSubtask(parseRouteId(request.params.id), updateSubtaskSchema.parse(request.body)));
});

export const removeSubtask = asyncHandler(async (request, response) => {
  await deleteSubtask(parseRouteId(request.params.id));
  response.status(204).end();
});

export const startTaskTimer = asyncHandler(async (request, response) => {
  response.status(201).json(await startTimer({ taskId: parseRouteId(request.params.id) }));
});

export const stopTaskTimer = asyncHandler(async (request, response) => {
  response.json(await stopTimer({ taskId: parseRouteId(request.params.id) }));
});

export const startSubtaskTimer = asyncHandler(async (request, response) => {
  response.status(201).json(await startTimer({ subtaskId: parseRouteId(request.params.id) }));
});

export const stopSubtaskTimer = asyncHandler(async (request, response) => {
  response.json(await stopTimer({ subtaskId: parseRouteId(request.params.id) }));
});

function parseRouteId(routeValue: string | string[] | undefined) {
  if (typeof routeValue === 'string') {
    return routeValue;
  }
  const error = new Error('Route ID must be a single string');
  Object.assign(error, { statusCode: 400 });
  throw error;
}
