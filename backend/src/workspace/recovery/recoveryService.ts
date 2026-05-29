import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { recordActivity } from '../../task/services/activityService.js';
import { reconcileCompletedTaskTimers } from '../../task/services/taskService.js';
import type { WorkspaceBackup } from '../validation/workspaceSchema.js';

type Transaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function restoreWorkspace(backup: WorkspaceBackup, mode: 'merge' | 'replace') {
  const summary = await prisma.$transaction(async (transaction) => {
    if (mode === 'replace') {
      await transaction.taskSession.deleteMany();
      await transaction.subtask.deleteMany();
      await transaction.task.deleteMany();
      await transaction.taskList.deleteMany();
      await transaction.activityEvent.deleteMany();
      await transaction.recycleBinItem.deleteMany();
      await transaction.taskStatus.deleteMany();
      await transaction.taskPriority.deleteMany();
    }
    await upsertBackup(transaction, backup);
    return { mode, taskLists: backup.taskLists.length, tasks: backup.tasks.length, subtasks: backup.subtasks.length, sessions: backup.sessions.length };
  });

  await recordActivity('imported', 'workspace', null, `Imported workspace using ${mode} mode`, summary);
  await reconcileCompletedTaskTimers();
  return summary;
}

async function upsertBackup(transaction: Transaction, backup: WorkspaceBackup) {
  const statusIdMap = new Map<string, string>();
  const priorityIdMap = new Map<string, string>();

  for (const status of backup.statuses) {
    const restored = await transaction.taskStatus.upsert({
      where: { name: status.name },
      update: { sortOrder: status.sortOrder },
      create: status
    });
    statusIdMap.set(status.id, restored.id);
  }

  for (const priority of backup.priorities) {
    const restored = await transaction.taskPriority.upsert({
      where: { name: priority.name },
      update: { sortOrder: priority.sortOrder },
      create: priority
    });
    priorityIdMap.set(priority.id, restored.id);
  }

  for (const list of backup.taskLists) {
    await transaction.taskList.upsert({
      where: { id: list.id },
      update: { name: list.name, createdAt: toDate(list.createdAt), updatedAt: toDate(list.updatedAt) },
      create: { id: list.id, name: list.name, createdAt: toDate(list.createdAt), updatedAt: toDate(list.updatedAt) }
    });
  }

  for (const task of backup.tasks) {
    const payload = {
      listId: task.listId,
      statusId: statusIdMap.get(task.statusId) ?? task.statusId,
      priorityId: priorityIdMap.get(task.priorityId) ?? task.priorityId,
      name: task.name,
      description: task.description,
      deletedAt: task.deletedAt ? toDate(task.deletedAt) : null,
      createdAt: toDate(task.createdAt),
      updatedAt: toDate(task.updatedAt)
    };
    await transaction.task.upsert({ where: { id: task.id }, update: payload, create: { id: task.id, ...payload } });
  }

  for (const subtask of backup.subtasks) {
    const payload = {
      taskId: subtask.taskId,
      statusId: statusIdMap.get(subtask.statusId) ?? subtask.statusId,
      name: subtask.name,
      description: subtask.description,
      deletedAt: subtask.deletedAt ? toDate(subtask.deletedAt) : null,
      createdAt: toDate(subtask.createdAt),
      updatedAt: toDate(subtask.updatedAt)
    };
    await transaction.subtask.upsert({ where: { id: subtask.id }, update: payload, create: { id: subtask.id, ...payload } });
  }

  for (const session of backup.sessions) {
    const payload = {
      taskId: session.taskId,
      subtaskId: session.subtaskId,
      startedAt: toDate(session.startedAt),
      endedAt: session.endedAt ? toDate(session.endedAt) : null,
      durationSeconds: session.durationSeconds
    };
    await transaction.taskSession.upsert({ where: { id: session.id }, update: payload, create: { id: session.id, ...payload } });
  }

  for (const item of backup.recycleBin) {
    await transaction.recycleBinItem.upsert({
      where: { id: item.id },
      update: { entity: item.entity, entityId: item.entityId, label: item.label, payload: item.payload, deletedAt: toDate(item.deletedAt) },
      create: { id: item.id, entity: item.entity, entityId: item.entityId, label: item.label, payload: item.payload, deletedAt: toDate(item.deletedAt) }
    });
  }
}

function toDate(value: string) {
  return new Date(value);
}
