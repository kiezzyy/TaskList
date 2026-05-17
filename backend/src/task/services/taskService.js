import {
  createList,
  createSession,
  createTask,
  deleteList,
  deleteTask,
  getLists,
  getOpenSession,
  getStatuses,
  getTask,
  getTasks,
  updateList,
  updateSession,
  updateTask
} from '../repositories/taskRepository.js';

function toTaskView(task) {
  const totalDurationSeconds = task.sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );
  const activeSession = task.sessions.find((session) => !session.endedAt) ?? null;
  return { ...task, totalDurationSeconds, activeSession };
}

export async function getWorkspaceState() {
  const [statuses, lists] = await Promise.all([getStatuses(), getLists()]);
  return {
    statuses,
    lists: lists.map((list) => ({ ...list, tasks: list.tasks.map(toTaskView) }))
  };
}

export async function addTaskList(input) {
  return createList(input);
}

export async function renameTaskList(id, input) {
  return updateList(id, input);
}

export async function removeTaskList(id) {
  return deleteList(id);
}

export async function listTasks(filters) {
  const tasks = await getTasks(filters);
  return tasks.map(toTaskView);
}

export async function addTask(input) {
  const statuses = await getStatuses();
  const statusId = input.statusId ?? statuses.find((status) => status.name === 'Not Started')?.id;
  return toTaskView(await createTask({ ...input, statusId }));
}

export async function editTask(id, input) {
  return toTaskView(await updateTask(id, input));
}

export async function removeTask(id) {
  return deleteTask(id);
}

export async function startTaskTimer(taskId) {
  const existing = await getOpenSession(taskId);
  if (existing) {
    return existing;
  }
  await getTaskOrThrow(taskId);
  return createSession({ taskId, startedAt: new Date() });
}

export async function stopTaskTimer(taskId) {
  const session = await getOpenSession(taskId);
  if (!session) {
    const error = new Error('No active timer is running for this task');
    error.statusCode = 409;
    throw error;
  }
  const endedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
  );
  return updateSession(session.id, { endedAt, durationSeconds });
}

async function getTaskOrThrow(id) {
  const task = await getTask(id);
  if (!task) {
    const error = new Error('Task was not found');
    error.statusCode = 404;
    throw error;
  }
  return task;
}
