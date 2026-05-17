import { z } from 'zod';
import { config } from '../../config/appConfig.js';

const isoDate = z.string().datetime();

export const workspaceBackupSchema = z.object({
  metadata: z.object({
    appVersion: z.string(),
    schemaVersion: z.number().int(),
    exportedAt: isoDate,
    totalTaskCount: z.number().int().nonnegative(),
    totalTaskListCount: z.number().int().nonnegative(),
    totalRecordedWorkDurationSeconds: z.number().int().nonnegative()
  }),
  statuses: z.array(
    z.object({
      id: z.string().min(1),
      name: z.enum(['Not Started', 'Ongoing', 'Completed']),
      sortOrder: z.number().int()
    })
  ),
  taskLists: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      createdAt: isoDate,
      updatedAt: isoDate
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      listId: z.string().min(1),
      statusId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().nullable(),
      createdAt: isoDate,
      updatedAt: isoDate
    })
  ),
  sessions: z.array(
    z.object({
      id: z.string().min(1),
      taskId: z.string().min(1),
      startedAt: isoDate,
      endedAt: isoDate.nullable(),
      durationSeconds: z.number().int().nonnegative()
    })
  )
});

export function validateWorkspaceBackup(payload) {
  const result = workspaceBackupSchema.safeParse(payload);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    };
  }

  const errors = getRelationshipErrors(result.data);
  if (result.data.metadata.schemaVersion !== config.schemaVersion) {
    errors.push(
      `Backup schema version ${result.data.metadata.schemaVersion} is not compatible with schema version ${config.schemaVersion}.`
    );
  }

  return { valid: errors.length === 0, errors, backup: result.data };
}

function getRelationshipErrors(backup) {
  const errors = [];
  const listIds = new Set(backup.taskLists.map((list) => list.id));
  const taskIds = new Set(backup.tasks.map((task) => task.id));
  const statusIds = new Set(backup.statuses.map((status) => status.id));

  addDuplicateErrors(errors, backup.taskLists, 'task list');
  addDuplicateErrors(errors, backup.tasks, 'task');
  addDuplicateErrors(errors, backup.sessions, 'session');

  for (const task of backup.tasks) {
    if (!listIds.has(task.listId)) {
      errors.push(`Task "${task.name}" references a missing task list.`);
    }
    if (!statusIds.has(task.statusId)) {
      errors.push(`Task "${task.name}" references a missing status.`);
    }
  }

  for (const session of backup.sessions) {
    if (!taskIds.has(session.taskId)) {
      errors.push(`Session ${session.id} references a missing task.`);
    }
  }

  return errors;
}

function addDuplicateErrors(errors, records, label) {
  const ids = new Set();
  for (const record of records) {
    if (ids.has(record.id)) {
      errors.push(`Duplicate ${label} ID detected: ${record.id}.`);
    }
    ids.add(record.id);
  }
}
