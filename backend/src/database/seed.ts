import { config } from '../config/appConfig.js';
import { prisma } from './prisma.js';

const statuses = [
  { name: 'To Do', sortOrder: 1, legacyNames: ['Not Started'] },
  { name: 'Progress', sortOrder: 2, legacyNames: ['Ongoing'] },
  { name: 'Reviewing', sortOrder: 3, legacyNames: [] },
  { name: 'Complete', sortOrder: 4, legacyNames: ['Completed'] }
] as const;

const priorities = [
  { name: 'Low', sortOrder: 1 },
  { name: 'Medium', sortOrder: 2 },
  { name: 'High', sortOrder: 3 },
  { name: 'Critical', sortOrder: 4 }
] as const;

export async function ensureSeedData() {
  for (const status of statuses) {
    await ensureCanonicalStatus(status.name, status.sortOrder, status.legacyNames);
  }

  for (const priority of priorities) {
    await prisma.taskPriority.upsert({
      where: { name: priority.name },
      update: { sortOrder: priority.sortOrder },
      create: priority
    });
  }

  const metadata = await prisma.workspaceMetadata.findFirst();
  if (!metadata) {
    await prisma.workspaceMetadata.create({
      data: { appVersion: config.appVersion, schemaVersion: config.schemaVersion }
    });
  }

  const listCount = await prisma.taskList.count();
  if (listCount === 0) {
    await prisma.taskList.create({ data: { name: 'Personal' } });
  }
}

async function ensureCanonicalStatus(name: string, sortOrder: number, legacyNames: readonly string[]) {
  const canonical = await prisma.taskStatus.upsert({
    where: { name },
    update: { sortOrder },
    create: { name, sortOrder }
  });

  for (const legacyName of legacyNames) {
    const legacy = await prisma.taskStatus.findUnique({ where: { name: legacyName } });
    if (!legacy || legacy.id === canonical.id) {
      continue;
    }

    await prisma.task.updateMany({ where: { statusId: legacy.id }, data: { statusId: canonical.id } });
    await prisma.subtask.updateMany({ where: { statusId: legacy.id }, data: { statusId: canonical.id } });
    await prisma.taskStatus.delete({ where: { id: legacy.id } });
  }
}
