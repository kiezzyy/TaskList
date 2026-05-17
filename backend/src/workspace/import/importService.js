import { restoreWorkspace } from '../recovery/recoveryService.js';
import { validateWorkspaceBackup } from '../validation/workspaceSchema.js';

export async function analyzeWorkspaceImport(payload) {
  const validation = validateWorkspaceBackup(payload);
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      guidance: 'Choose a JSON workspace export created by this TaskList app version.'
    };
  }
  return {
    valid: true,
    metadata: validation.backup.metadata,
    counts: {
      taskLists: validation.backup.taskLists.length,
      tasks: validation.backup.tasks.length,
      sessions: validation.backup.sessions.length
    }
  };
}

export async function importWorkspace(payload, mode) {
  const validation = validateWorkspaceBackup(payload);
  if (!validation.valid) {
    const error = new Error('Workspace import validation failed');
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }
  return restoreWorkspace(validation.backup, mode);
}
