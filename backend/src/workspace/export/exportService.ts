import { config } from '../../config/appConfig.js';
import { prisma } from '../../database/prisma.js';
import { recordActivity } from '../../task/services/activityService.js';

export async function createWorkspaceExport() {
  const exportedAt = new Date();
  const [statuses, priorities, taskLists, tasks, subtasks, taskSessions, history, recycleBin] = await Promise.all([
    prisma.taskStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskPriority.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskList.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.task.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.subtask.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.taskSession.findMany({ orderBy: { startedAt: 'asc' } }),
    prisma.activityEvent.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.recycleBinItem.findMany({ orderBy: { deletedAt: 'desc' } })
  ]);

  if (taskLists.length === 0) {
    const error = new Error('Create at least one tab before exporting the workspace.');
    Object.assign(error, { statusCode: 409 });
    throw error;
  }

  const serializedTaskSessions = taskSessions.map((taskSession) => serializeTaskSession(taskSession, exportedAt));
  const workspaceBackup = {
    metadata: {
      appVersion: config.appVersion,
      schemaVersion: config.schemaVersion,
      exportedAt: exportedAt.toISOString(),
      totalTaskCount: tasks.length,
      totalTaskListCount: taskLists.length,
      totalSubtaskCount: subtasks.length,
      totalRecordedWorkDurationSeconds: serializedTaskSessions.reduce((total, taskSession) => total + Number(taskSession.durationSeconds), 0)
    },
    statuses: statuses.map(serializeRecord),
    priorities: priorities.map(serializeRecord),
    taskLists: taskLists.map(serializeRecord),
    tasks: tasks.map(serializeRecord),
    subtasks: subtasks.map(serializeRecord),
    sessions: serializedTaskSessions,
    history: history.map(serializeRecord),
    recycleBin: recycleBin.map(serializeRecord)
  };

  await prisma.workspaceMetadata.updateMany({ data: { lastExportAt: new Date(), appVersion: config.appVersion, schemaVersion: config.schemaVersion } });
  await recordActivity('exported', 'workspace', null, 'Exported workspace backup', workspaceBackup.metadata);
  return workspaceBackup;
}

function serializeRecord<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));
}

function serializeTaskSession(taskSession: { startedAt: Date; endedAt: Date | null; durationSeconds: number } & Record<string, unknown>, exportedAt: Date) {
  if (taskSession.endedAt) {
    return serializeRecord(taskSession);
  }
  return serializeRecord({
    ...taskSession,
    endedAt: exportedAt,
    durationSeconds: Math.max(0, Math.floor((exportedAt.getTime() - taskSession.startedAt.getTime()) / 1000))
  });
}
