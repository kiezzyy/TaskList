import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let prisma: Awaited<typeof import('../../database/prisma.js')>['prisma'];
let initializeDatabase: typeof import('../../database/initSchema.js')['initializeDatabase'];
let createWorkspaceExport: typeof import('./exportService.js')['createWorkspaceExport'];

const dbFile = path.resolve('prisma', `export-${process.pid}-${Date.now()}.db`);

beforeAll(async () => {
  process.env.DATABASE_URL = `file:${dbFile.replace(/\\/g, '/')}`;
  ({ prisma } = await import('../../database/prisma.js'));
  ({ initializeDatabase } = await import('../../database/initSchema.js'));
  ({ createWorkspaceExport } = await import('./exportService.js'));
  await initializeDatabase();
});

beforeEach(async () => {
  await clearWorkspace();
});

afterAll(async () => {
  await prisma.$disconnect();
  await fs.rm(dbFile, { force: true });
});

describe('workspace export', () => {
  it('rejects exports when the workspace has no tabs', async () => {
    await expect(createWorkspaceExport()).rejects.toMatchObject({
      statusCode: 409,
      message: 'Create at least one tab before exporting the workspace.'
    });
  });
});

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
