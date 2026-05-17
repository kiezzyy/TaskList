import { prisma } from '../../database/prisma.js';

const taskInclude = {
  status: true,
  sessions: { orderBy: { startedAt: 'desc' } }
};

export async function getStatuses() {
  return prisma.taskStatus.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function getLists() {
  return prisma.taskList.findMany({
    include: { tasks: { include: taskInclude, orderBy: { updatedAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function createList(data) {
  return prisma.taskList.create({ data });
}

export async function updateList(id, data) {
  return prisma.taskList.update({ where: { id }, data });
}

export async function deleteList(id) {
  return prisma.taskList.delete({ where: { id } });
}

export async function getTasks(filters) {
  return prisma.task.findMany({
    where: {
      listId: filters.listId,
      statusId: filters.statusId,
      OR: filters.search
        ? [
            { name: { contains: filters.search } },
            { description: { contains: filters.search } }
          ]
        : undefined
    },
    include: taskInclude,
    orderBy: { updatedAt: 'desc' }
  });
}

export async function createTask(data) {
  return prisma.task.create({ data, include: taskInclude });
}

export async function updateTask(id, data) {
  return prisma.task.update({ where: { id }, data, include: taskInclude });
}

export async function deleteTask(id) {
  return prisma.task.delete({ where: { id } });
}

export async function getTask(id) {
  return prisma.task.findUnique({ where: { id }, include: taskInclude });
}

export async function createSession(data) {
  return prisma.taskSession.create({ data });
}

export async function updateSession(id, data) {
  return prisma.taskSession.update({ where: { id }, data });
}

export async function getOpenSession(taskId) {
  return prisma.taskSession.findFirst({
    where: { taskId, endedAt: null },
    orderBy: { startedAt: 'desc' }
  });
}
