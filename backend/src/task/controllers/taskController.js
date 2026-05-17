import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  createListSchema,
  createTaskSchema,
  parseBody,
  taskQuerySchema,
  updateListSchema,
  updateTaskSchema
} from '../validators/taskSchemas.js';
import {
  addTask,
  addTaskList,
  editTask,
  getWorkspaceState,
  listTasks,
  removeTask,
  removeTaskList,
  renameTaskList,
  startTaskTimer,
  stopTaskTimer
} from '../services/taskService.js';

export const getState = asyncHandler(async (_request, response) => {
  response.json(await getWorkspaceState());
});

export const createTaskList = asyncHandler(async (request, response) => {
  const input = parseBody(createListSchema, request.body);
  response.status(201).json(await addTaskList(input));
});

export const updateTaskList = asyncHandler(async (request, response) => {
  const input = parseBody(updateListSchema, request.body);
  response.json(await renameTaskList(request.params.id, input));
});

export const deleteTaskList = asyncHandler(async (request, response) => {
  await removeTaskList(request.params.id);
  response.status(204).end();
});

export const getTasks = asyncHandler(async (request, response) => {
  const filters = taskQuerySchema.parse(request.query);
  response.json(await listTasks(filters));
});

export const createNewTask = asyncHandler(async (request, response) => {
  const input = parseBody(createTaskSchema, request.body);
  response.status(201).json(await addTask(input));
});

export const updateExistingTask = asyncHandler(async (request, response) => {
  const input = parseBody(updateTaskSchema, request.body);
  response.json(await editTask(request.params.id, input));
});

export const deleteExistingTask = asyncHandler(async (request, response) => {
  await removeTask(request.params.id);
  response.status(204).end();
});

export const startTimer = asyncHandler(async (request, response) => {
  response.status(201).json(await startTaskTimer(request.params.id));
});

export const resumeTimer = startTimer;

export const stopTimer = asyncHandler(async (request, response) => {
  response.json(await stopTaskTimer(request.params.id));
});

export const pauseTimer = stopTimer;
