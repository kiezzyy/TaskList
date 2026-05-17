import { config } from '../config/appConfig.js';
import { prisma } from './prisma.js';

const defaultStatuses = [
  { name: 'Not Started', sortOrder: 1 },
  { name: 'Ongoing', sortOrder: 2 },
  { name: 'Completed', sortOrder: 3 }
];

export async function ensureDefaultStatuses() {
  for (const status of defaultStatuses) {
    await prisma.taskStatus.upsert({
      where: { name: status.name },
      update: { sortOrder: status.sortOrder },
      create: status
    });
  }

  const metadata = await prisma.workspaceMetadata.findFirst();
  if (!metadata) {
    await prisma.workspaceMetadata.create({
      data: {
        appVersion: config.appVersion,
        schemaVersion: config.schemaVersion
      }
    });
  }
}
