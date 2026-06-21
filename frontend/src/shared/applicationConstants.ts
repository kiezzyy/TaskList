export const applicationInfo = {
  name: 'TaskList'
} as const;

export const localApiDefaults = {
  developmentApiBaseUrl: 'http://localhost:4000/api',
  productionApiBaseUrl: '/api',
  packagedHost: '127.0.0.1',
  packagedFallbackPort: '5000',
  packagedPortQueryKey: 'apiPort'
} as const;

export const taskStatusNames = {
  todo: 'To Do',
  inProgress: 'Progress',
  reviewing: 'Reviewing',
  complete: 'Complete'
} as const;

export const taskPriorityNames = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
} as const;

export const timerSettings = {
  tickIntervalMs: 1000
} as const;

export const importSettings = {
  jsonMimeType: 'application/json',
  maxBackupFileMegabytes: 20,
  bytesPerMegabyte: 1024 * 1024
} as const;

export const maxBackupFileBytes = importSettings.maxBackupFileMegabytes * importSettings.bytesPerMegabyte;
