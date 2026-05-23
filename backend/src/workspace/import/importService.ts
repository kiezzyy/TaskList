import { restoreWorkspace } from '../recovery/recoveryService.js';
import { validateWorkspaceBackup } from '../validation/workspaceSchema.js';

export async function analyzeWorkspaceImport(payload: unknown) {
  const validation = validateWorkspaceBackup(payload);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors, guidance: 'Select a valid TaskList JSON backup created by this app version.' };
  }
  return {
    valid: true,
    metadata: validation.backup.metadata,
    counts: {
      taskLists: validation.backup.taskLists.length,
      tasks: validation.backup.tasks.length,
      subtasks: validation.backup.subtasks.length,
      sessions: validation.backup.sessions.length
    }
  };
}

export async function importWorkspace(payload: unknown, mode: 'merge' | 'replace') {
  const validation = validateWorkspaceBackup(payload);
  if (!validation.valid) {
    const error = new Error('Workspace import validation failed');
    Object.assign(error, { statusCode: 400, details: validation.errors });
    throw error;
  }
  return restoreWorkspace(validation.backup, mode);
}
