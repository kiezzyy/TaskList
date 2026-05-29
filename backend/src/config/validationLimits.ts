export const textLimits = {
  id: 128,
  appVersion: 40,
  statusName: 80,
  priorityName: 80,
  taskListName: 120,
  taskName: 160,
  taskDescription: 4000,
  activityType: 80,
  activityEntity: 80,
  activityMessage: 500,
  serializedPayload: 10_000,
  recycleBinLabel: 200
} as const;

export const workspaceBackupLimits = {
  statusCount: 50,
  priorityCount: 50,
  taskListCount: 500,
  taskCount: 10_000,
  subtaskCount: 50_000,
  sessionCount: 100_000,
  activityHistoryCount: 10_000,
  recycleBinCount: 10_000
} as const;

export const requestLimits = {
  jsonBody: '25mb',
  workspaceOperationWindowMs: 60_000,
  workspaceOperationMaxRequests: 20
} as const;
