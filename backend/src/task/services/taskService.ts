import type { Prisma, TaskSession } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { recordActivity } from './activityService.js';
import { durationSeconds } from './timerMath.js';

const taskInclude = {
  status: true,
  priority: true,
  subtasks: { where: { deletedAt: null }, include: { status: true, sessions: { orderBy: { startedAt: 'desc' } } } },
  sessions: { orderBy: { startedAt: 'desc' } }
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
const timerLocks = new Map<string, Promise<unknown>>();

function totalDuration(sessions: TaskSession[]) {
  return sessions.reduce((total, session) => {
    return session.endedAt ? total + session.durationSeconds : total;
  }, 0);
}

function withComputedTask(task: TaskWithRelations) {
  const subtasks = task.subtasks.map((subtask) => ({
    ...subtask,
    totalDurationSeconds: totalDuration(subtask.sessions),
    activeSession: subtask.sessions.find((session) => !session.endedAt) ?? null
  }));
  const completed = subtasks.filter((subtask) => subtask.status.name === 'Complete').length;
  return {
    ...task,
    subtasks,
    progress: subtasks.length ? Math.round((completed / subtasks.length) * 100) : task.status.name === 'Complete' ? 100 : 0,
    totalDurationSeconds: totalDuration(task.sessions),
    activeSession: task.sessions.find((session) => !session.endedAt) ?? null
  };
}

export async function getWorkspaceState() {
  const [statuses, priorities, lists, history, recycleBin] = await Promise.all([
    prisma.taskStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskPriority.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskList.findMany({
      include: { tasks: { where: { deletedAt: null }, include: taskInclude, orderBy: { updatedAt: 'desc' } } },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.activityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.recycleBinItem.findMany({ orderBy: { deletedAt: 'desc' }, take: 100 })
  ]);

  return {
    statuses,
    priorities,
    lists: lists.map((list) => ({ ...list, tasks: list.tasks.map(withComputedTask) })),
    history,
    recycleBin
  };
}

export async function createList(input: { name: string }) {
  const list = await prisma.taskList.create({ data: input });
  await recordActivity('created', 'task_list', list.id, `Created list "${list.name}"`, list);
  return { ...list, tasks: [] };
}

export async function updateList(id: string, input: { name: string }) {
  const list = await prisma.taskList.update({ where: { id }, data: input });
  await recordActivity('updated', 'task_list', id, `Renamed list to "${list.name}"`, list);
  return list;
}

export async function deleteList(id: string) {
  const list = await prisma.taskList.findUnique({ where: { id }, include: { tasks: { include: taskInclude } } });
  if (!list) {
    throw notFound('Task list was not found');
  }
  await prisma.recycleBinItem.create({
    data: { entity: 'task_list', entityId: id, label: list.name, payload: JSON.stringify(list) }
  });
  await prisma.taskList.delete({ where: { id } });
  await recordActivity('deleted', 'task_list', id, `Moved list "${list.name}" to recycle bin`);
}

export async function createTask(input: { listId: string; name: string; description?: string | null; statusId?: string; priorityId?: string }) {
  const [status, priority] = await Promise.all([
    input.statusId ? prisma.taskStatus.findUnique({ where: { id: input.statusId } }) : prisma.taskStatus.findUnique({ where: { name: 'To Do' } }),
    input.priorityId ? prisma.taskPriority.findUnique({ where: { id: input.priorityId } }) : prisma.taskPriority.findUnique({ where: { name: 'Medium' } })
  ]);
  if (!status || !priority) {
    throw notFound('Task status or priority was not found');
  }
  const task = await prisma.task.create({
    data: { ...input, statusId: status.id, priorityId: priority.id },
    include: taskInclude
  });
  await recordActivity('created', 'task', task.id, `Created task "${task.name}"`, task);
  return withComputedTask(task);
}

export async function updateTask(id: string, input: Prisma.TaskUpdateInput) {
  const task = await prisma.task.update({ where: { id }, data: input, include: taskInclude });
  await recordActivity('updated', 'task', id, `Updated task "${task.name}"`, task);
  return withComputedTask(task);
}

export async function deleteTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) {
    throw notFound('Task was not found');
  }
  await prisma.recycleBinItem.create({
    data: { entity: 'task', entityId: id, label: task.name, payload: JSON.stringify(task) }
  });
  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  await recordActivity('deleted', 'task', id, `Moved task "${task.name}" to recycle bin`);
}

export async function createSubtask(input: { taskId: string; name: string; description?: string | null; statusId?: string }) {
  const status = input.statusId
    ? await prisma.taskStatus.findUnique({ where: { id: input.statusId } })
    : await prisma.taskStatus.findUnique({ where: { name: 'To Do' } });
  if (!status) {
    throw notFound('Subtask status was not found');
  }
  const subtask = await prisma.subtask.create({ data: { ...input, statusId: status.id }, include: { status: true, sessions: true } });
  await recordActivity('created', 'subtask', subtask.id, `Created subtask "${subtask.name}"`, subtask);
  return subtask;
}

export async function updateSubtask(id: string, input: Prisma.SubtaskUpdateInput) {
  const subtask = await prisma.subtask.update({ where: { id }, data: input, include: { status: true, sessions: true } });
  await recordActivity('updated', 'subtask', id, `Updated subtask "${subtask.name}"`, subtask);
  return subtask;
}

export async function deleteSubtask(id: string) {
  const subtask = await prisma.subtask.findUnique({ where: { id }, include: { status: true, sessions: true } });
  if (!subtask) {
    throw notFound('Subtask was not found');
  }
  await prisma.recycleBinItem.create({
    data: { entity: 'subtask', entityId: id, label: subtask.name, payload: JSON.stringify(subtask) }
  });
  await prisma.subtask.update({ where: { id }, data: { deletedAt: new Date() } });
  await recordActivity('deleted', 'subtask', id, `Moved subtask "${subtask.name}" to recycle bin`);
}

export async function startTimer(target: { taskId?: string; subtaskId?: string }) {
  validateTimerTarget(target);
  return withTimerLock(target, async () => {
    const open = await getOpenSession(target);
    if (open) {
      return open;
    }
    const session = await prisma.taskSession.create({ data: { ...target, startedAt: new Date() } });
    await recordActivity('timer_started', target.taskId ? 'task' : 'subtask', target.taskId ?? target.subtaskId ?? null, 'Started timer', session);
    return session;
  });
}

export async function stopTimer(target: { taskId?: string; subtaskId?: string }) {
  validateTimerTarget(target);
  return withTimerLock(target, async () => {
    const sessions = await getOpenSessions(target);
    if (!sessions.length) {
      const error = new Error('No active timer is running');
      Object.assign(error, { statusCode: 409 });
      throw error;
    }
    const endedAt = new Date();
    const updates = await Promise.all(
      sessions.map((session) =>
        prisma.taskSession.update({
          where: { id: session.id },
          data: { endedAt, durationSeconds: durationSeconds(session.startedAt, endedAt) }
        })
      )
    );
    const updated = updates[0];
    await recordActivity('timer_stopped', target.taskId ? 'task' : 'subtask', target.taskId ?? target.subtaskId ?? null, 'Stopped timer', updated);
    return updated;
  });
}

async function getOpenSession(target: { taskId?: string; subtaskId?: string }) {
  return prisma.taskSession.findFirst({ where: { ...target, endedAt: null }, orderBy: { startedAt: 'desc' } });
}

async function getOpenSessions(target: { taskId?: string; subtaskId?: string }) {
  return prisma.taskSession.findMany({ where: { ...target, endedAt: null }, orderBy: { startedAt: 'desc' } });
}

async function withTimerLock<T>(target: { taskId?: string; subtaskId?: string }, operation: () => Promise<T>) {
  const key = timerKey(target);
  const previous = timerLocks.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  timerLocks.set(key, next);
  try {
    return await next;
  } finally {
    if (timerLocks.get(key) === next) {
      timerLocks.delete(key);
    }
  }
}

function validateTimerTarget(target: { taskId?: string; subtaskId?: string }) {
  if (Boolean(target.taskId) === Boolean(target.subtaskId)) {
    const error = new Error('Timer target must be exactly one task or subtask');
    Object.assign(error, { statusCode: 400 });
    throw error;
  }
}

function timerKey(target: { taskId?: string; subtaskId?: string }) {
  return target.taskId ? `task:${target.taskId}` : `subtask:${target.subtaskId}`;
}

function notFound(message: string) {
  const error = new Error(message);
  Object.assign(error, { statusCode: 404 });
  return error;
}
