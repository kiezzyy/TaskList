import { prisma } from '../../database/prisma.js';

export async function recordActivity(type: string, entity: string, entityId: string | null, message: string, payload?: unknown) {
  await prisma.activityEvent.create({
    data: {
      type,
      entity,
      entityId,
      message,
      payload: payload ? JSON.stringify(payload) : null
    }
  });
}
