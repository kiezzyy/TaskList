import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let prisma: Awaited<typeof import('../../database/prisma.js')>['prisma'];
let initializeDatabase: typeof import('../../database/initSchema.js')['initializeDatabase'];
let createWorkspaceExport: typeof import('../export/exportService.js')['createWorkspaceExport'];
let importWorkspace: typeof import('./importService.js')['importWorkspace'];
let validateWorkspaceBackup: typeof import('../validation/workspaceSchema.js')['validateWorkspaceBackup'];

const dbFile = path.resolve('prisma', `roundtrip-${process.pid}-${Date.now()}.db`);

beforeAll(async () => {
  process.env.DATABASE_URL = `file:${dbFile.replace(/\\/g, '/')}`;
  ({ prisma } = await import('../../database/prisma.js'));
  ({ initializeDatabase } = await import('../../database/initSchema.js'));
  ({ createWorkspaceExport } = await import('../export/exportService.js'));
  ({ importWorkspace } = await import('./importService.js'));
  ({ validateWorkspaceBackup } = await import('../validation/workspaceSchema.js'));
  await initializeDatabase();
});

beforeEach(async () => {
  await clearWorkspace();
});

afterAll(async () => {
  await prisma.$disconnect();
  await fs.rm(dbFile, { force: true });
});

describe('workspace export/import round trip', () => {
  it('restores an exported workspace into the database without data loss', async () => {
    await createFixtureWorkspace();

    const backup = await createWorkspaceExport();
    expect(validateWorkspaceBackup(backup).valid).toBe(true);
    const exportedActiveSession = backup.sessions.find((session) => session.id === 'session-active');
    expect(exportedActiveSession).toMatchObject({ endedAt: backup.metadata.exportedAt });
    expect(Number(exportedActiveSession?.durationSeconds)).toBeGreaterThan(0);
    expect(backup.metadata.totalRecordedWorkDurationSeconds).toBe(
      backup.sessions.reduce((total, session) => total + Number(session.durationSeconds), 0)
    );

    await clearWorkspace();
    const summary = await importWorkspace(backup, 'replace');

    expect(summary).toMatchObject({
      mode: 'replace',
      taskLists: 1,
      tasks: 1,
      subtasks: 1,
      sessions: 2,
      history: 1,
      recycleBin: 1
    });
    await expectDatabaseMatchesBackup(backup);
    await expect(prisma.taskSession.count({ where: { endedAt: null } })).resolves.toBe(0);
  });

  it('rejects malformed backups before writing records', async () => {
    await prisma.taskList.create({ data: { id: 'existing-list', name: 'Keep me', createdAt: new Date('2026-05-01T00:00:00.000Z'), updatedAt: new Date('2026-05-01T00:00:00.000Z') } });
    const invalidBackup = {
      metadata: {
        appVersion: '1.0.8',
        schemaVersion: 2,
        exportedAt: 'not-a-date',
        totalTaskCount: 0,
        totalTaskListCount: 0,
        totalSubtaskCount: 0,
        totalRecordedWorkDurationSeconds: 0
      },
      statuses: [],
      priorities: [],
      taskLists: [],
      tasks: [],
      subtasks: [],
      sessions: [],
      history: [],
      recycleBin: []
    };

    await expect(importWorkspace(invalidBackup, 'replace')).rejects.toMatchObject({
      statusCode: 400,
      details: expect.arrayContaining([expect.stringContaining('Malformed timestamp')])
    });
    await expect(prisma.taskList.findMany()).resolves.toHaveLength(1);
  });
});

async function createFixtureWorkspace() {
  const createdAt = new Date('2026-05-20T10:00:00.000Z');
  const updatedAt = new Date('2026-05-20T11:00:00.000Z');
  await prisma.taskStatus.createMany({
    data: [
      { id: 'status-todo', name: 'To Do', sortOrder: 1 },
      { id: 'status-complete', name: 'Complete', sortOrder: 2 }
    ]
  });
  await prisma.taskPriority.create({ data: { id: 'priority-high', name: 'High', sortOrder: 3 } });
  await prisma.taskList.create({ data: { id: 'list-main', name: 'Launch', createdAt, updatedAt } });
  await prisma.task.create({
    data: {
      id: 'task-main',
      listId: 'list-main',
      statusId: 'status-todo',
      priorityId: 'priority-high',
      name: 'Ship import fixes',
      description: 'Round-trip the whole workspace.',
      createdAt,
      updatedAt
    }
  });
  await prisma.subtask.create({
    data: {
      id: 'subtask-main',
      taskId: 'task-main',
      statusId: 'status-complete',
      name: 'Verify sessions',
      description: null,
      createdAt,
      updatedAt
    }
  });
  await prisma.taskSession.createMany({
    data: [
      {
        id: 'session-complete',
        taskId: 'task-main',
        subtaskId: null,
        startedAt: new Date('2026-05-20T10:00:00.000Z'),
        endedAt: new Date('2026-05-20T10:30:00.000Z'),
        durationSeconds: 1800
      },
      {
        id: 'session-active',
        taskId: null,
        subtaskId: 'subtask-main',
        startedAt: new Date('2026-05-20T10:45:00.000Z'),
        endedAt: null,
        durationSeconds: 0
      }
    ]
  });
  await prisma.activityEvent.create({
    data: {
      id: 'history-main',
      type: 'created',
      entity: 'task',
      entityId: 'task-main',
      message: 'Created task "Ship import fixes"',
      payload: '{"id":"task-main"}',
      createdAt
    }
  });
  await prisma.recycleBinItem.create({
    data: {
      id: 'recycle-main',
      entity: 'task',
      entityId: 'deleted-task',
      label: 'Deleted task',
      payload: JSON.stringify({ id: 'deleted-task', snapshot: 'x'.repeat(12_000) }),
      deletedAt: updatedAt
    }
  });
  await prisma.workspaceMetadata.create({
    data: {
      id: 'metadata-main',
      appVersion: '1.0.8',
      schemaVersion: 2,
      lastExportAt: null,
      updatedAt: createdAt
    }
  });
}

async function expectDatabaseMatchesBackup(backup: Awaited<ReturnType<typeof createWorkspaceExport>>) {
  expect(normalize(await prisma.taskStatus.findMany({ orderBy: { id: 'asc' } }))).toEqual(sortById(backup.statuses));
  expect(normalize(await prisma.taskPriority.findMany({ orderBy: { id: 'asc' } }))).toEqual(sortById(backup.priorities));
  expect(normalize(await prisma.taskList.findMany({ orderBy: { id: 'asc' } }))).toEqual(sortById(backup.taskLists));
  expect(normalize(await prisma.task.findMany({ orderBy: { id: 'asc' } }))).toEqual(sortById(backup.tasks));
  expect(normalize(await prisma.subtask.findMany({ orderBy: { id: 'asc' } }))).toEqual(sortById(backup.subtasks));
  expect(normalize(await prisma.taskSession.findMany({ orderBy: { id: 'asc' } }))).toEqual(sortById(backup.sessions));
  expect(normalize(await prisma.recycleBinItem.findMany({ orderBy: { id: 'asc' } }))).toEqual(sortById(backup.recycleBin));

  const restoredHistory = normalize(await prisma.activityEvent.findMany({ where: { id: { in: backup.history.map((event) => String(event.id)) } }, orderBy: { id: 'asc' } }));
  expect(restoredHistory).toEqual(sortById(backup.history));

  const metadata = await prisma.workspaceMetadata.findFirst();
  expect(metadata).toMatchObject({
    appVersion: backup.metadata.appVersion,
    schemaVersion: backup.metadata.schemaVersion,
    lastExportAt: new Date(backup.metadata.exportedAt)
  });
}

async function clearWorkspace() {
  await prisma.taskSession.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskList.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.recycleBinItem.deleteMany();
  await prisma.taskStatus.deleteMany();
  await prisma.taskPriority.deleteMany();
  await prisma.workspaceMetadata.deleteMany();
}

function normalize(records: Record<string, unknown>[]) {
  return records.map((record) =>
    Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]))
  );
}

function sortById<T extends Record<string, unknown>>(records: T[]) {
  return [...records].sort((left, right) => String(left.id).localeCompare(String(right.id)));
}
