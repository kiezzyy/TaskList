import { taskPriorityNames, taskStatusNames, workspaceDefaults } from '../config/appConstants.js';
import { config } from '../config/appConfig.js';
import { prisma } from './prisma.js';

const statuses = [
  { name: taskStatusNames.todo, sortOrder: 1, legacyNames: ['Not Started'] },
  { name: taskStatusNames.inProgress, sortOrder: 2, legacyNames: ['Ongoing'] },
  { name: taskStatusNames.reviewing, sortOrder: 3, legacyNames: [] },
  { name: taskStatusNames.complete, sortOrder: 4, legacyNames: ['Completed'] }
] as const;

const priorities = [
  { name: taskPriorityNames.low, sortOrder: 1 },
  { name: taskPriorityNames.medium, sortOrder: 2 },
  { name: taskPriorityNames.high, sortOrder: 3 },
  { name: taskPriorityNames.critical, sortOrder: 4 }
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
    await prisma.taskList.create({ data: { name: workspaceDefaults.initialListName } });
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
