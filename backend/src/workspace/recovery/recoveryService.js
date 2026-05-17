import { prisma } from '../../database/prisma.js';

export async function restoreWorkspace(backup, mode) {
  if (mode === 'replace') {
    return replaceWorkspace(backup);
  }
  if (mode === 'merge') {
    return mergeWorkspace(backup);
  }
  const error = new Error('Import mode must be merge or replace');
  error.statusCode = 400;
  throw error;
}

async function replaceWorkspace(backup) {
  return prisma.$transaction(async (transaction) => {
    await transaction.taskSession.deleteMany();
    await transaction.task.deleteMany();
    await transaction.taskList.deleteMany();
    await transaction.taskStatus.deleteMany();
    await upsertBackup(transaction, backup);
    return getImportSummary(backup, 'replace');
  });
}

async function mergeWorkspace(backup) {
  return prisma.$transaction(async (transaction) => {
    await upsertBackup(transaction, backup);
    return getImportSummary(backup, 'merge');
  });
}

async function upsertBackup(transaction, backup) {
  const statusIdMap = new Map();

  for (const status of backup.statuses) {
    const restored = await transaction.taskStatus.upsert({
      where: { name: status.name },
      update: { sortOrder: status.sortOrder },
      create: { id: status.id, name: status.name, sortOrder: status.sortOrder }
    });
    statusIdMap.set(status.id, restored.id);
  }

  for (const list of backup.taskLists) {
    await transaction.taskList.upsert({
      where: { id: list.id },
      update: {
        name: list.name,
        createdAt: new Date(list.createdAt),
        updatedAt: new Date(list.updatedAt)
      },
      create: {
        id: list.id,
        name: list.name,
        createdAt: new Date(list.createdAt),
        updatedAt: new Date(list.updatedAt)
      }
    });
  }

  for (const task of backup.tasks) {
    await transaction.task.upsert({
      where: { id: task.id },
      update: taskPayload(task, statusIdMap),
      create: { id: task.id, ...taskPayload(task, statusIdMap) }
    });
  }

  for (const session of backup.sessions) {
    await transaction.taskSession.upsert({
      where: { id: session.id },
      update: sessionPayload(session),
      create: { id: session.id, ...sessionPayload(session) }
    });
  }
}

function taskPayload(task, statusIdMap) {
  return {
    listId: task.listId,
    statusId: statusIdMap.get(task.statusId),
    name: task.name,
    description: task.description,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt)
  };
}

function sessionPayload(session) {
  return {
    taskId: session.taskId,
    startedAt: new Date(session.startedAt),
    endedAt: session.endedAt ? new Date(session.endedAt) : null,
    durationSeconds: session.durationSeconds
  };
}

function getImportSummary(backup, mode) {
  return {
    mode,
    taskLists: backup.taskLists.length,
    tasks: backup.tasks.length,
    sessions: backup.sessions.length
  };
}
