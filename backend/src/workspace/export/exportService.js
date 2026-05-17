import { config } from '../../config/appConfig.js';
import { prisma } from '../../database/prisma.js';

export async function createWorkspaceExport() {
  const [statuses, taskLists, tasks, sessions] = await Promise.all([
    prisma.taskStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.taskList.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.task.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.taskSession.findMany({ orderBy: { startedAt: 'asc' } })
  ]);

  const totalRecordedWorkDurationSeconds = sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );

  const backup = {
    metadata: {
      appVersion: config.appVersion,
      schemaVersion: config.schemaVersion,
      exportedAt: new Date().toISOString(),
      totalTaskCount: tasks.length,
      totalTaskListCount: taskLists.length,
      totalRecordedWorkDurationSeconds
    },
    statuses: statuses.map(serializeRecord),
    taskLists: taskLists.map(serializeRecord),
    tasks: tasks.map(serializeRecord),
    sessions: sessions.map(serializeRecord)
  };

  await prisma.workspaceMetadata.updateMany({
    data: { lastExportAt: new Date(), appVersion: config.appVersion, schemaVersion: config.schemaVersion }
  });

  return backup;
}

function serializeRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value
    ])
  );
}
