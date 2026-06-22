export const apiRoutes = {
  health: '/health',
  state: '/state',
  lists: '/lists',
  list: (listId: string) => `/lists/${listId}`,
  tasks: '/tasks',
  task: (taskId: string) => `/tasks/${taskId}`,
  restoreTask: (taskId: string) => `/tasks/${taskId}/restore`,
  startTaskTimer: (taskId: string) => `/tasks/${taskId}/timer/start`,
  stopTaskTimer: (taskId: string) => `/tasks/${taskId}/timer/stop`,
  exportWorkspace: '/workspace/export',
  analyzeWorkspaceImport: '/workspace/import/analyze',
  importWorkspace: (mode: 'merge' | 'replace') => `/workspace/import?mode=${mode}`
} as const;
