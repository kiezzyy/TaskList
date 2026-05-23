import { config } from '../../config/appConfig.js';
import { prisma } from '../../database/prisma.js';
import { recordActivity } from '../../task/services/activityService.js';

export async function createWorkspaceExport() {
  const exportedAt = new Date();
  const [statuses, priorities, taskLists, tasks, subtasks, sessions, history, recycleBin] = await Promise.all([
    prisma.taskStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskPriority.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskList.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.task.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.subtask.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.taskSession.findMany({ orderBy: { startedAt: 'asc' } }),
    prisma.activityEvent.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.recycleBinItem.findMany({ orderBy: { deletedAt: 'desc' } })
  ]);

  const backup = {
    metadata: {
      appVersion: config.appVersion,
      schemaVersion: config.schemaVersion,
      exportedAt: exportedAt.toISOString(),
      totalTaskCount: tasks.length,
      totalTaskListCount: taskLists.length,
      totalSubtaskCount: subtasks.length,
      totalRecordedWorkDurationSeconds: sessions.reduce((total, session) => total + session.durationSeconds, 0)
    },
    statuses: statuses.map(serialize),
    priorities: priorities.map(serialize),
    taskLists: taskLists.map(serialize),
    tasks: tasks.map(serialize),
    subtasks: subtasks.map(serialize),
    sessions: sessions.map((session) => serializeSession(session, exportedAt)),
    history: history.map(serialize),
    recycleBin: recycleBin.map(serialize)
  };

  await prisma.workspaceMetadata.updateMany({ data: { lastExportAt: new Date(), appVersion: config.appVersion, schemaVersion: config.schemaVersion } });
  await recordActivity('exported', 'workspace', null, 'Exported workspace backup', backup.metadata);
  return backup;
}

function serialize<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));
}

function serializeSession(session: { startedAt: Date; endedAt: Date | null; durationSeconds: number } & Record<string, unknown>, exportedAt: Date) {
  if (session.endedAt) {
    return serialize(session);
  }
  return serialize({
    ...session,
    endedAt: exportedAt,
    durationSeconds: Math.max(0, Math.floor((exportedAt.getTime() - session.startedAt.getTime()) / 1000))
  });
}
