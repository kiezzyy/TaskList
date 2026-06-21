export const applicationInfo = {
  name: 'TaskList',
  version: '1.0.8',
  schemaVersion: 2
} as const;

export const networkDefaults = {
  backendPort: 5000,
  backendHost: '127.0.0.1',
  frontendOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173']
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

export const workspaceDefaults = {
  initialListName: 'Personal',
  activityHistoryLimit: 100,
  recycleBinLimit: 100
} as const;

export const timerSettings = {
  tickIntervalMs: 1000,
  futureStartToleranceMs: 60_000
} as const;

export const progressSettings = {
  completePercent: 100
} as const;
