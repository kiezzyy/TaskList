import type { Prisma, TaskSession } from '@prisma/client';
import { progressSettings, taskPriorityNames, taskStatusNames, workspaceDefaults } from '../../config/appConstants.js';
import { prisma } from '../../database/prisma.js';
import { recordActivity } from './activityService.js';
import { durationSeconds } from './timerMath.js';

const taskInclude = {
  status: true,
  priority: true,
  subtasks: { where: { deletedAt: null }, include: { status: true, sessions: { orderBy: { startedAt: 'desc' } } } },
  sessions: { orderBy: { startedAt: 'desc' } }
} satisfies Prisma.TaskInclude;

const subtaskInclude = {
  status: true,
  sessions: { orderBy: { startedAt: 'desc' } }
} satisfies Prisma.SubtaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
type SubtaskWithRelations = Prisma.SubtaskGetPayload<{ include: typeof subtaskInclude }>;
const timerLocks = new Map<string, Promise<unknown>>();
const timerAllowedStatuses = new Set<string>([taskStatusNames.inProgress, taskStatusNames.reviewing]);

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
  const completed = subtasks.filter((subtask) => subtask.status.name === taskStatusNames.complete).length;
  return {
    ...task,
    subtasks,
    progress: subtasks.length ? Math.round((completed / subtasks.length) * progressSettings.completePercent) : task.status.name === taskStatusNames.complete ? progressSettings.completePercent : 0,
    totalDurationSeconds: totalDuration(task.sessions),
    activeSession: task.sessions.find((session) => !session.endedAt) ?? null
  };
}

export async function getWorkspaceState() {
  await reconcileTaskTimers();
  const [statuses, priorities, lists, history, recycleBin] = await Promise.all([
    prisma.taskStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskPriority.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskList.findMany({
      include: { tasks: { where: { deletedAt: null }, include: taskInclude, orderBy: { updatedAt: 'desc' } } },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.activityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: workspaceDefaults.activityHistoryLimit }),
    prisma.recycleBinItem.findMany({ orderBy: { deletedAt: 'desc' }, take: workspaceDefaults.recycleBinLimit })
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

export async function restoreList(id: string) {
  const binItem = await prisma.recycleBinItem.findFirst({ where: { entity: 'task_list', entityId: id }, orderBy: { deletedAt: 'desc' } });
  if (!binItem) {
    throw notFound('Task list backup was not found');
  }
  const existing = await prisma.taskList.findUnique({ where: { id } });
  if (existing) {
    const error = new Error('Task list already exists');
    Object.assign(error, { statusCode: 409 });
    throw error;
  }
  const snapshot = parseTaskListSnapshot(binItem.payload);

  await prisma.$transaction(async (tx) => {
    await tx.taskList.create({
      data: { id: snapshot.id, name: snapshot.name, createdAt: new Date(snapshot.createdAt), updatedAt: new Date(snapshot.updatedAt) }
    });
    for (const snapshotTask of snapshot.tasks ?? []) {
      const statusId = await resolveStatusId(tx, snapshotTask.status);
      const priorityId = await resolvePriorityId(tx, snapshotTask.priority);
      await tx.task.create({
        data: {
          id: snapshotTask.id,
          listId: snapshot.id,
          statusId,
          priorityId,
          name: snapshotTask.name,
          description: snapshotTask.description,
          createdAt: new Date(snapshotTask.createdAt),
          updatedAt: new Date(snapshotTask.updatedAt)
        }
      });
      for (const snapshotSubtask of snapshotTask.subtasks ?? []) {
        const subtaskStatusId = await resolveStatusId(tx, snapshotSubtask.status);
        await tx.subtask.create({
          data: {
            id: snapshotSubtask.id,
            taskId: snapshotTask.id,
            statusId: subtaskStatusId,
            name: snapshotSubtask.name,
            description: snapshotSubtask.description,
            createdAt: new Date(snapshotSubtask.createdAt),
            updatedAt: new Date(snapshotSubtask.updatedAt)
          }
        });
        for (const snapshotSession of snapshotSubtask.sessions ?? []) {
          await tx.taskSession.create({
            data: {
              id: snapshotSession.id,
              taskId: null,
              subtaskId: snapshotSubtask.id,
              startedAt: new Date(snapshotSession.startedAt),
              endedAt: snapshotSession.endedAt ? new Date(snapshotSession.endedAt) : null,
              durationSeconds: snapshotSession.durationSeconds ?? 0
            }
          });
        }
      }
      for (const snapshotSession of snapshotTask.sessions ?? []) {
        await tx.taskSession.create({
          data: {
            id: snapshotSession.id,
            taskId: snapshotTask.id,
            subtaskId: null,
            startedAt: new Date(snapshotSession.startedAt),
            endedAt: snapshotSession.endedAt ? new Date(snapshotSession.endedAt) : null,
            durationSeconds: snapshotSession.durationSeconds ?? 0
          }
        });
      }
    }
    await tx.recycleBinItem.deleteMany({ where: { entity: 'task_list', entityId: id } });
  });

  await recordActivity('restored', 'task_list', id, `Restored tab "${snapshot.name}"`);
  const restored = await prisma.taskList.findUnique({
    where: { id },
    include: { tasks: { where: { deletedAt: null }, include: taskInclude, orderBy: { updatedAt: 'desc' } } }
  });
  if (!restored) {
    throw notFound('Task list was not found');
  }
  return { ...restored, tasks: restored.tasks.map(withComputedTask) };
}

export async function createTask(input: { listId: string; name: string; description?: string | null; statusId?: string; priorityId?: string }) {
  const [status, priority] = await Promise.all([
    input.statusId ? prisma.taskStatus.findUnique({ where: { id: input.statusId } }) : prisma.taskStatus.findUnique({ where: { name: taskStatusNames.todo } }),
    input.priorityId ? prisma.taskPriority.findUnique({ where: { id: input.priorityId } }) : prisma.taskPriority.findUnique({ where: { name: taskPriorityNames.medium } })
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
  const previous = await prisma.task.findUnique({ where: { id }, include: { status: true } });
  if (!previous) {
    throw notFound('Task was not found');
  }
  const task = await prisma.task.update({ where: { id }, data: input, include: taskInclude });
  await recordActivity('updated', 'task', id, `Updated task "${task.name}"`, task);
  if (!canTimerRun(task.status.name)) {
    await stopOpenSessions({ taskId: id }, 'Timer stopped automatically because task moved to a non-timer status');
    const refreshedTask = await prisma.task.findUnique({ where: { id }, include: taskInclude });
    if (!refreshedTask) {
      throw notFound('Task was not found');
    }
    return withComputedTask(refreshedTask);
  }
  if (previous.statusId !== task.statusId) {
    try {
      await startTimer({ taskId: id });
    } catch {
      return withComputedTask(task);
    }
    const refreshedTask = await prisma.task.findUnique({ where: { id }, include: taskInclude });
    if (refreshedTask) {
      return withComputedTask(refreshedTask);
    }
  }
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

export async function restoreTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) {
    throw notFound('Task was not found');
  }
  const restored = await prisma.task.update({
    where: { id },
    data: { deletedAt: null },
    include: taskInclude
  });
  await prisma.recycleBinItem.deleteMany({ where: { entity: 'task', entityId: id } });
  await recordActivity('restored', 'task', id, `Restored task "${restored.name}"`, restored);
  return withComputedTask(restored);
}

export async function createSubtask(input: { taskId: string; name: string; description?: string | null; statusId?: string }) {
  const status = input.statusId
    ? await prisma.taskStatus.findUnique({ where: { id: input.statusId } })
    : await prisma.taskStatus.findUnique({ where: { name: taskStatusNames.todo } });
  if (!status) {
    throw notFound('Subtask status was not found');
  }
  const subtask = await prisma.subtask.create({ data: { ...input, statusId: status.id }, include: subtaskInclude });
  await recordActivity('created', 'subtask', subtask.id, `Created subtask "${subtask.name}"`, subtask);
  return subtask;
}

export async function updateSubtask(id: string, input: Prisma.SubtaskUpdateInput) {
  const previous = await prisma.subtask.findUnique({ where: { id }, include: { status: true } });
  if (!previous) {
    throw notFound('Subtask was not found');
  }
  const subtask = await prisma.subtask.update({ where: { id }, data: input, include: subtaskInclude });
  await recordActivity('updated', 'subtask', id, `Updated subtask "${subtask.name}"`, subtask);
  if (!canTimerRun(subtask.status.name)) {
    await stopOpenSessions({ subtaskId: id }, 'Timer stopped automatically because subtask moved to a non-timer status');
    const refreshedSubtask = await prisma.subtask.findUnique({ where: { id }, include: subtaskInclude });
    if (!refreshedSubtask) {
      throw notFound('Subtask was not found');
    }
    return refreshedSubtask;
  }
  if (previous.statusId !== subtask.statusId) {
    try {
      await startTimer({ subtaskId: id });
    } catch {
      return subtask;
    }
    const refreshedSubtask = await prisma.subtask.findUnique({ where: { id }, include: subtaskInclude });
    if (refreshedSubtask) {
      return refreshedSubtask;
    }
  }
  return subtask;
}

export async function deleteSubtask(id: string) {
  const subtask = await prisma.subtask.findUnique({ where: { id }, include: subtaskInclude });
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
    await ensureTimerTargetCanStart(target);
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

export async function reconcileTaskTimers() {
  const [taskSessions, subtaskSessions] = await Promise.all([
    prisma.taskSession.findMany({
      where: { endedAt: null, task: { status: { name: { notIn: [...timerAllowedStatuses] } } } },
      select: { taskId: true }
    }),
    prisma.taskSession.findMany({
      where: { endedAt: null, subtask: { status: { name: { notIn: [...timerAllowedStatuses] } } } },
      select: { subtaskId: true }
    })
  ]);

  const taskIds = [...new Set(taskSessions.map((session) => session.taskId).filter((taskId): taskId is string => Boolean(taskId)))];
  const subtaskIds = [...new Set(subtaskSessions.map((session) => session.subtaskId).filter((subtaskId): subtaskId is string => Boolean(subtaskId)))];

  await Promise.all([
    ...taskIds.map((taskId) => stopOpenSessions({ taskId }, 'Timer stopped automatically because task moved to a non-timer status')),
    ...subtaskIds.map((subtaskId) => stopOpenSessions({ subtaskId }, 'Timer stopped automatically because subtask moved to a non-timer status'))
  ]);
}

async function getOpenSession(target: { taskId?: string; subtaskId?: string }) {
  return prisma.taskSession.findFirst({ where: { ...target, endedAt: null }, orderBy: { startedAt: 'desc' } });
}

async function getOpenSessions(target: { taskId?: string; subtaskId?: string }) {
  return prisma.taskSession.findMany({ where: { ...target, endedAt: null }, orderBy: { startedAt: 'desc' } });
}

async function stopOpenSessions(target: { taskId?: string; subtaskId?: string }, message: string) {
  return withTimerLock(target, async () => {
    const sessions = await getOpenSessions(target);
    if (!sessions.length) {
      return null;
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
    await recordActivity('timer_stopped', target.taskId ? 'task' : 'subtask', target.taskId ?? target.subtaskId ?? null, message, updated);
    return updated;
  });
}

async function ensureTimerTargetCanStart(target: { taskId?: string; subtaskId?: string }) {
  if (target.taskId) {
    const task = await prisma.task.findUnique({ where: { id: target.taskId }, include: { status: true } });
    if (!task) {
      throw notFound('Task was not found');
    }
    if (!canTimerRun(task.status.name)) {
      throw timerStatusError('task');
    }
    return;
  }

  const subtask = await prisma.subtask.findUnique({ where: { id: target.subtaskId }, include: { status: true } });
  if (!subtask) {
    throw notFound('Subtask was not found');
  }
  if (!canTimerRun(subtask.status.name)) {
    throw timerStatusError('subtask');
  }
}

function canTimerRun(statusName: string) {
  return timerAllowedStatuses.has(statusName);
}

function timerStatusError(entity: 'task' | 'subtask') {
  const error = new Error(`${entity === 'task' ? 'Tasks' : 'Subtasks'} in To Do or Complete cannot start timers. Move it to Progress or Reviewing first.`);
  Object.assign(error, { statusCode: 409 });
  return error;
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

type SnapshotSession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds?: number;
};

type SnapshotSubtask = {
  id: string;
  name: string;
  description: string | null;
  status?: { id?: string; name?: string };
  sessions?: SnapshotSession[];
  createdAt: string;
  updatedAt: string;
};

type SnapshotTask = {
  id: string;
  name: string;
  description: string | null;
  status?: { id?: string; name?: string };
  priority?: { id?: string; name?: string };
  subtasks?: SnapshotSubtask[];
  sessions?: SnapshotSession[];
  createdAt: string;
  updatedAt: string;
};

type SnapshotTaskList = {
  id: string;
  name: string;
  tasks?: SnapshotTask[];
  createdAt: string;
  updatedAt: string;
};

function parseTaskListSnapshot(payload: string): SnapshotTaskList {
  try {
    const snapshot = JSON.parse(payload) as SnapshotTaskList;
    if (!snapshot || typeof snapshot.id !== 'string' || typeof snapshot.name !== 'string') {
      throw new Error('Invalid task list backup');
    }
    return snapshot;
  } catch {
    const error = new Error('Task list backup is corrupted');
    Object.assign(error, { statusCode: 422 });
    throw error;
  }
}

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function resolveStatusId(tx: TransactionClient, reference: { id?: string; name?: string } | undefined) {
  if (reference?.id) {
    const byId = await tx.taskStatus.findUnique({ where: { id: reference.id } });
    if (byId) {
      return byId.id;
    }
  }
  if (reference?.name) {
    const byName = await tx.taskStatus.findUnique({ where: { name: reference.name } });
    if (byName) {
      return byName.id;
    }
  }
  const fallback = await tx.taskStatus.findFirst({ orderBy: { sortOrder: 'asc' } });
  if (fallback) {
    return fallback.id;
  }
  throw notFound('Task status was not found');
}

async function resolvePriorityId(tx: TransactionClient, reference: { id?: string; name?: string } | undefined) {
  if (reference?.id) {
    const byId = await tx.taskPriority.findUnique({ where: { id: reference.id } });
    if (byId) {
      return byId.id;
    }
  }
  if (reference?.name) {
    const byName = await tx.taskPriority.findUnique({ where: { name: reference.name } });
    if (byName) {
      return byName.id;
    }
  }
  const fallback = await tx.taskPriority.findFirst({ orderBy: { sortOrder: 'asc' } });
  if (fallback) {
    return fallback.id;
  }
  throw notFound('Task priority was not found');
}
