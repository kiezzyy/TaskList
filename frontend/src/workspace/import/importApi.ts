import { apiRequest } from '../../shared/api';
import { apiRoutes } from '../../shared/apiRoutes';
import { applicationInfo, importSettings, maxBackupFileBytes } from '../../shared/applicationConstants';
import { ImportAnalysis } from '../../task/services/types';

export async function parseWorkspaceFile(file: File) {
  // Accept common JSON MIME types or check file extension as fallback
  const jsonMimeTypes = ['application/json', 'text/json', 'text/plain'];
  const hasJsonExtension = file.name.endsWith('.json');
  const hasValidMimeType = !file.type || jsonMimeTypes.includes(file.type);
  
  if (!hasJsonExtension && !hasValidMimeType) {
    throw new Error(`Choose a JSON file exported from ${applicationInfo.name}.`);
  }
  
  if (file.size > maxBackupFileBytes) {
    throw new Error(`Workspace backups must be ${importSettings.maxBackupFileMegabytes} MB or smaller.`);
  }
  try {
    return JSON.parse(await file.text()) as unknown;
  } catch {
    throw new Error('The selected backup is not valid JSON.');
  }
}

export function analyzeWorkspace(payload: unknown) {
  return apiRequest<ImportAnalysis>(apiRoutes.analyzeWorkspaceImport, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function importWorkspace(payload: unknown, mode: 'merge' | 'replace') {
  return apiRequest<{ mode: string; taskLists: number; tasks: number; subtasks: number; sessions: number }>(
    apiRoutes.importWorkspace(mode),
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}
