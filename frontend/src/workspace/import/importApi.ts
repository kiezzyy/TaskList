import { apiRequest } from '../../shared/api';
import { ImportAnalysis } from '../../task/services/types';

export async function parseWorkspaceFile(file: File) {
  if (file.type && file.type !== 'application/json') {
    throw new Error('Choose a JSON file exported from TaskList.');
  }
  return JSON.parse(await file.text()) as unknown;
}

export function analyzeWorkspace(payload: unknown) {
  return apiRequest<ImportAnalysis>('/workspace/import/analyze', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function importWorkspace(payload: unknown, mode: 'merge' | 'replace') {
  return apiRequest<{ mode: string; taskLists: number; tasks: number; sessions: number }>(
    `/workspace/import?mode=${mode}`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}
