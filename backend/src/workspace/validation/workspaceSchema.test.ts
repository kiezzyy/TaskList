import { describe, expect, it } from 'vitest';
import { config } from '../../config/appConfig.js';
import { validateWorkspaceBackup } from './workspaceSchema.js';

const backup = {
  metadata: {
    appVersion: '2.0.0',
    schemaVersion: config.schemaVersion,
    exportedAt: '2026-05-19T00:00:00.000Z',
    totalTaskCount: 1,
    totalTaskListCount: 1,
    totalSubtaskCount: 1,
    totalRecordedWorkDurationSeconds: 60
  },
  statuses: [{ id: 'status-1', name: 'Not Started', sortOrder: 1 }],
  priorities: [{ id: 'priority-1', name: 'Medium', sortOrder: 2 }],
  taskLists: [{ id: 'list-1', name: 'Inbox', createdAt: '2026-05-19T00:00:00.000Z', updatedAt: '2026-05-19T00:00:00.000Z' }],
  tasks: [
    {
      id: 'task-1',
      listId: 'list-1',
      statusId: 'status-1',
      priorityId: 'priority-1',
      name: 'Build',
      description: null,
      deletedAt: null,
      createdAt: '2026-05-19T00:00:00.000Z',
      updatedAt: '2026-05-19T00:00:00.000Z'
    }
  ],
  subtasks: [
    {
      id: 'subtask-1',
      taskId: 'task-1',
      statusId: 'status-1',
      name: 'Wire UI',
      description: null,
      deletedAt: null,
      createdAt: '2026-05-19T00:00:00.000Z',
      updatedAt: '2026-05-19T00:00:00.000Z'
    }
  ],
  sessions: [
    {
      id: 'session-1',
      taskId: 'task-1',
      subtaskId: null,
      startedAt: '2026-05-19T00:00:00.000Z',
      endedAt: '2026-05-19T00:01:00.000Z',
      durationSeconds: 60
    }
  ],
  history: [],
  recycleBin: []
};

describe('workspace backup validation', () => {
  it('accepts a complete backup', () => {
    expect(validateWorkspaceBackup(backup).valid).toBe(true);
  });

  it('rejects corrupted relationships', () => {
    const invalid = structuredClone(backup);
    invalid.tasks[0].listId = 'missing-list';
    const result = validateWorkspaceBackup(invalid);
    expect(result.valid).toBe(false);
  });

  it('returns clear errors for malformed timestamps', () => {
    const invalid = structuredClone(backup);
    invalid.metadata.exportedAt = 'not-a-date';
    const result = validateWorkspaceBackup(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Malformed timestamp at metadata.exportedAt. Use an ISO-8601 date/time value.'
      ])
    );
  });

  it('rejects unsupported schema versions', () => {
    const invalid = structuredClone(backup);
    invalid.metadata.schemaVersion = config.schemaVersion + 1;
    const result = validateWorkspaceBackup(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([`Backup schema version ${config.schemaVersion + 1} is not compatible with schema version ${config.schemaVersion}.`])
    );
  });

  it('rejects duplicate IDs and duplicate lookup names', () => {
    const invalid = structuredClone(backup);
    invalid.statuses.push({ id: 'status-1', name: 'Not Started', sortOrder: 2 });
    const result = validateWorkspaceBackup(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(['Duplicate status ID detected: status-1.', 'Duplicate status name detected: not started.']));
  });

  it('rejects metadata count mismatches', () => {
    const invalid = structuredClone(backup);
    invalid.metadata.totalTaskCount = 2;
    const result = validateWorkspaceBackup(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(['Backup metadata says it contains 2 tasks, but 1 task records were found.']));
  });
});
