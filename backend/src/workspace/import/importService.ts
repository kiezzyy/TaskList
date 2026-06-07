import { restoreWorkspace } from '../recovery/recoveryService.js';
import { validateWorkspaceBackup } from '../validation/workspaceSchema.js';

export async function analyzeWorkspaceImport(payload: unknown) {
  logImport('validation_started', { operation: 'analyze' });
  const validation = validateWorkspaceBackup(payload);
  if (!validation.valid) {
    logImport('validation_failed', { operation: 'analyze', errorCount: validation.errors.length });
    return { valid: false, errors: validation.errors, guidance: 'Select a valid TaskList JSON backup created by this app version.' };
  }
  logImport('validation_passed', { operation: 'analyze', metadata: validation.backup.metadata });
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
  logImport('validation_started', { operation: 'import', mode });
  const validation = validateWorkspaceBackup(payload);
  if (!validation.valid) {
    logImport('validation_failed', { operation: 'import', mode, errorCount: validation.errors.length });
    const error = new Error('Workspace import validation failed');
    Object.assign(error, { statusCode: 400, details: validation.errors });
    throw error;
  }
  logImport('validation_passed', { operation: 'import', mode, metadata: validation.backup.metadata });
  return restoreWorkspace(validation.backup, mode);
}

function logImport(event: string, details: Record<string, unknown>) {
  console.info(JSON.stringify({ scope: 'workspace_import', event, ...details }));
}
