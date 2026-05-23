import { apiRequest } from '../../shared/api';
import { ImportAnalysis } from '../../task/services/types';

export async function parseWorkspaceFile(file: File) {
  if (file.type && file.type !== 'application/json') {
    throw new Error('Choose a JSON file exported from TaskList.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Workspace backups must be 20 MB or smaller.');
  }
  try {
    return JSON.parse(await file.text()) as unknown;
  } catch {
    throw new Error('The selected backup is not valid JSON.');
  }
}

export function analyzeWorkspace(payload: unknown) {
  return apiRequest<ImportAnalysis>('/workspace/import/analyze', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function importWorkspace(payload: unknown, mode: 'merge' | 'replace') {
  return apiRequest<{ mode: string; taskLists: number; tasks: number; subtasks: number; sessions: number }>(
    `/workspace/import?mode=${mode}`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}
