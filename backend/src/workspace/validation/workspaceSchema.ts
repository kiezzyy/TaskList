import { z } from 'zod';
import { config } from '../../config/appConfig.js';
import { timerSettings } from '../../config/appConstants.js';
import { textLimits, workspaceBackupLimits } from '../../config/validationLimits.js';

const dateString = z.string().datetime();
const nullableDate = dateString.nullable();
const safeText = (max: number) => z.string().trim().max(max).transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''));
const idString = z.string().trim().min(1).max(textLimits.id);

export const workspaceBackupSchema = z.object({
  metadata: z.object({
    appVersion: safeText(textLimits.appVersion),
    schemaVersion: z.number().int(),
    exportedAt: dateString,
    totalTaskCount: z.number().int().nonnegative(),
    totalTaskListCount: z.number().int().nonnegative(),
    totalSubtaskCount: z.number().int().nonnegative(),
    totalRecordedWorkDurationSeconds: z.number().int().nonnegative()
  }).strict(),
  statuses: z.array(z.object({ id: idString, name: safeText(textLimits.statusName), sortOrder: z.number().int() }).strict()).max(workspaceBackupLimits.statusCount),
  priorities: z.array(z.object({ id: idString, name: safeText(textLimits.priorityName), sortOrder: z.number().int() }).strict()).max(workspaceBackupLimits.priorityCount),
  taskLists: z.array(z.object({ id: idString, name: safeText(textLimits.taskListName), createdAt: dateString, updatedAt: dateString }).strict()).max(workspaceBackupLimits.taskListCount),
  tasks: z.array(
    z.object({
      id: idString,
      listId: idString,
      statusId: idString,
      priorityId: idString,
      name: safeText(textLimits.taskName),
      description: safeText(textLimits.taskDescription).nullable(),
      deletedAt: nullableDate,
      createdAt: dateString,
      updatedAt: dateString
    }).strict()
  ).max(workspaceBackupLimits.taskCount),
  subtasks: z.array(
    z.object({
      id: idString,
      taskId: idString,
      statusId: idString,
      name: safeText(textLimits.taskName),
      description: safeText(textLimits.taskDescription).nullable(),
      deletedAt: nullableDate,
      createdAt: dateString,
      updatedAt: dateString
    }).strict()
  ).max(workspaceBackupLimits.subtaskCount),
  sessions: z.array(
    z.object({
      id: idString,
      taskId: idString.nullable(),
      subtaskId: idString.nullable(),
      startedAt: dateString,
      endedAt: nullableDate,
      durationSeconds: z.number().int().nonnegative()
    }).strict()
  ).max(workspaceBackupLimits.sessionCount),
  history: z.array(
    z.object({
      id: idString,
      type: safeText(textLimits.activityType),
      entity: safeText(textLimits.activityEntity),
      entityId: idString.nullable(),
      message: safeText(textLimits.activityMessage),
      payload: safeText(textLimits.serializedPayload).nullable(),
      createdAt: dateString
    }).strict()
  ).max(workspaceBackupLimits.activityHistoryCount),
  recycleBin: z.array(
    z.object({
      id: idString,
      entity: safeText(textLimits.activityEntity),
      entityId: idString,
      label: safeText(textLimits.recycleBinLabel),
      payload: safeText(textLimits.serializedPayload),
      deletedAt: dateString
    }).strict()
  ).max(workspaceBackupLimits.recycleBinCount)
}).strict();

export type WorkspaceBackup = z.infer<typeof workspaceBackupSchema>;

export function validateWorkspaceBackup(payload: unknown) {
  const parsed = workspaceBackupSchema.safeParse(payload);
  if (!parsed.success) {
    return { valid: false as const, errors: parsed.error.issues.map(formatSchemaIssue) };
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

  addDuplicates(errors, 'task list ID', backup.taskLists.map((item) => item.id));
  addDuplicates(errors, 'task ID', backup.tasks.map((item) => item.id));
  addDuplicates(errors, 'subtask ID', backup.subtasks.map((item) => item.id));
  addDuplicates(errors, 'session ID', backup.sessions.map((item) => item.id));
  addDuplicates(errors, 'status ID', backup.statuses.map((item) => item.id));
  addDuplicates(errors, 'priority ID', backup.priorities.map((item) => item.id));
  addDuplicates(errors, 'history event ID', backup.history.map((item) => item.id));
  addDuplicates(errors, 'recycle bin item ID', backup.recycleBin.map((item) => item.id));
  addDuplicates(errors, 'status name', backup.statuses.map((item) => item.name.toLowerCase()));
  addDuplicates(errors, 'priority name', backup.priorities.map((item) => item.name.toLowerCase()));

  if (backup.metadata.totalTaskCount !== backup.tasks.length) {
    errors.push(`Backup metadata says it contains ${backup.metadata.totalTaskCount} tasks, but ${backup.tasks.length} task records were found.`);
  }
  if (backup.metadata.totalTaskListCount !== backup.taskLists.length) {
    errors.push(`Backup metadata says it contains ${backup.metadata.totalTaskListCount} task lists, but ${backup.taskLists.length} task list records were found.`);
  }
  if (backup.metadata.totalSubtaskCount !== backup.subtasks.length) {
    errors.push(`Backup metadata says it contains ${backup.metadata.totalSubtaskCount} subtasks, but ${backup.subtasks.length} subtask records were found.`);
  }
  const recordedDuration = backup.sessions.reduce((total, session) => total + session.durationSeconds, 0);
  if (backup.metadata.totalRecordedWorkDurationSeconds !== recordedDuration) {
    errors.push(
      `Backup metadata says it contains ${backup.metadata.totalRecordedWorkDurationSeconds} seconds of recorded work, but session records total ${recordedDuration} seconds.`
    );
  }

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
    if (new Date(session.startedAt).getTime() > Date.now() + timerSettings.futureStartToleranceMs) errors.push(`Session ${session.id} starts in the future.`);
    if (session.endedAt && new Date(session.endedAt).getTime() < new Date(session.startedAt).getTime()) errors.push(`Session ${session.id} ends before it starts.`);
  }

  addDuplicateActiveSessions(errors, backup.sessions);

  return errors;
}

function addDuplicates(errors: string[], label: string, ids: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`Duplicate ${label} detected: ${id}.`);
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

function formatSchemaIssue(issue: z.ZodIssue) {
  const path = issue.path.length ? issue.path.join('.') : 'backup';
  if (issue.code === z.ZodIssueCode.invalid_type && issue.received === 'undefined') {
    return `Missing required field: ${path}.`;
  }
  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'datetime') {
    return `Malformed timestamp at ${path}. Use an ISO-8601 date/time value.`;
  }
  if (issue.code === z.ZodIssueCode.unrecognized_keys) {
    return `Unsupported field at ${path}: ${issue.keys.join(', ')}.`;
  }
  if (issue.code === z.ZodIssueCode.too_big && issue.type === 'string') {
    return `Field ${path} is too large to import. Export a smaller workspace or remove oversized recycle-bin/history entries.`;
  }
  return `${path}: ${issue.message}`;
}
