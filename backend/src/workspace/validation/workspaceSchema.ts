import { z } from 'zod';
import { config } from '../../config/appConfig.js';

const dateString = z.string().datetime();
const nullableDate = dateString.nullable();
const safeText = (max: number) => z.string().trim().max(max).transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''));
const idString = z.string().trim().min(1).max(128);

export const workspaceBackupSchema = z.object({
  metadata: z.object({
    appVersion: safeText(40),
    schemaVersion: z.number().int(),
    exportedAt: dateString,
    totalTaskCount: z.number().int().nonnegative(),
    totalTaskListCount: z.number().int().nonnegative(),
    totalSubtaskCount: z.number().int().nonnegative(),
    totalRecordedWorkDurationSeconds: z.number().int().nonnegative()
  }),
  statuses: z.array(z.object({ id: idString, name: safeText(80), sortOrder: z.number().int() })).max(50),
  priorities: z.array(z.object({ id: idString, name: safeText(80), sortOrder: z.number().int() })).max(50),
  taskLists: z.array(z.object({ id: idString, name: safeText(120), createdAt: dateString, updatedAt: dateString })).max(500),
  tasks: z.array(
    z.object({
      id: idString,
      listId: idString,
      statusId: idString,
      priorityId: idString,
      name: safeText(160),
      description: safeText(4000).nullable(),
      deletedAt: nullableDate,
      createdAt: dateString,
      updatedAt: dateString
    })
  ).max(10000),
  subtasks: z.array(
    z.object({
      id: idString,
      taskId: idString,
      statusId: idString,
      name: safeText(160),
      description: safeText(4000).nullable(),
      deletedAt: nullableDate,
      createdAt: dateString,
      updatedAt: dateString
    })
  ).max(50000),
  sessions: z.array(
    z.object({
      id: idString,
      taskId: idString.nullable(),
      subtaskId: idString.nullable(),
      startedAt: dateString,
      endedAt: nullableDate,
      durationSeconds: z.number().int().nonnegative()
    })
  ).max(100000),
  history: z.array(
    z.object({
      id: idString,
      type: safeText(80),
      entity: safeText(80),
      entityId: idString.nullable(),
      message: safeText(500),
      payload: safeText(10000).nullable(),
      createdAt: dateString
    })
  ).max(10000),
  recycleBin: z.array(
    z.object({
      id: idString,
      entity: safeText(80),
      entityId: idString,
      label: safeText(200),
      payload: safeText(10000),
      deletedAt: dateString
    })
  ).max(10000)
});

export type WorkspaceBackup = z.infer<typeof workspaceBackupSchema>;

export function validateWorkspaceBackup(payload: unknown) {
  const parsed = workspaceBackupSchema.safeParse(payload);
  if (!parsed.success) {
    return { valid: false as const, errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
  }

  const errors = relationshipErrors(parsed.data);
  if (parsed.data.metadata.schemaVersion !== config.schemaVersion) {
    errors.push(`Backup schema version ${parsed.data.metadata.schemaVersion} is not compatible with schema version ${config.schemaVersion}.`);
  }

  return errors.length ? { valid: false as const, errors } : { valid: true as const, backup: parsed.data };
}

function relationshipErrors(backup: WorkspaceBackup) {
  const errors: string[] = [];
  const listIds = new Set(backup.taskLists.map((item) => item.id));
  const taskIds = new Set(backup.tasks.map((item) => item.id));
  const subtaskIds = new Set(backup.subtasks.map((item) => item.id));
  const statusIds = new Set(backup.statuses.map((item) => item.id));
  const priorityIds = new Set(backup.priorities.map((item) => item.id));

  addDuplicates(errors, 'task list', backup.taskLists.map((item) => item.id));
  addDuplicates(errors, 'task', backup.tasks.map((item) => item.id));
  addDuplicates(errors, 'subtask', backup.subtasks.map((item) => item.id));
  addDuplicates(errors, 'session', backup.sessions.map((item) => item.id));

  for (const task of backup.tasks) {
    if (!listIds.has(task.listId)) errors.push(`Task "${task.name}" references a missing task list.`);
    if (!statusIds.has(task.statusId)) errors.push(`Task "${task.name}" references a missing status.`);
    if (!priorityIds.has(task.priorityId)) errors.push(`Task "${task.name}" references a missing priority.`);
  }

  for (const subtask of backup.subtasks) {
    if (!taskIds.has(subtask.taskId)) errors.push(`Subtask "${subtask.name}" references a missing task.`);
    if (!statusIds.has(subtask.statusId)) errors.push(`Subtask "${subtask.name}" references a missing status.`);
  }

  for (const session of backup.sessions) {
    if (session.taskId && !taskIds.has(session.taskId)) errors.push(`Session ${session.id} references a missing task.`);
    if (session.subtaskId && !subtaskIds.has(session.subtaskId)) errors.push(`Session ${session.id} references a missing subtask.`);
    if (!session.taskId && !session.subtaskId) errors.push(`Session ${session.id} has no task or subtask target.`);
    if (session.taskId && session.subtaskId) errors.push(`Session ${session.id} has more than one timer target.`);
    if (new Date(session.startedAt).getTime() > Date.now() + 60_000) errors.push(`Session ${session.id} starts in the future.`);
    if (session.endedAt && new Date(session.endedAt).getTime() < new Date(session.startedAt).getTime()) errors.push(`Session ${session.id} ends before it starts.`);
  }

  addDuplicateActiveSessions(errors, backup.sessions);

  return errors;
}

function addDuplicates(errors: string[], label: string, ids: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`Duplicate ${label} ID detected: ${id}.`);
    seen.add(id);
  }
}

function addDuplicateActiveSessions(errors: string[], sessions: WorkspaceBackup['sessions']) {
  const activeTargets = new Set<string>();
  for (const session of sessions) {
    if (session.endedAt) {
      continue;
    }
    const target = session.taskId ? `task:${session.taskId}` : `subtask:${session.subtaskId}`;
    if (activeTargets.has(target)) {
      errors.push(`Multiple active timer sessions detected for ${target}.`);
    }
    activeTargets.add(target);
  }
}
