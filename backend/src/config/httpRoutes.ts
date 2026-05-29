export const apiRoutes = {
  root: '/api',
  health: '/api/health',
  workspace: '/api/workspace'
} as const;

export const taskRoutePaths = {
  state: '/state',
  lists: '/lists',
  listById: '/lists/:id',
  tasks: '/tasks',
  taskById: '/tasks/:id',
  taskRestore: '/tasks/:id/restore',
  taskTimerStart: '/tasks/:id/timer/start',
  taskTimerPause: '/tasks/:id/timer/pause',
  taskTimerResume: '/tasks/:id/timer/resume',
  taskTimerStop: '/tasks/:id/timer/stop',
  subtasks: '/subtasks',
  subtaskById: '/subtasks/:id',
  subtaskTimerStart: '/subtasks/:id/timer/start',
  subtaskTimerPause: '/subtasks/:id/timer/pause',
  subtaskTimerResume: '/subtasks/:id/timer/resume',
  subtaskTimerStop: '/subtasks/:id/timer/stop'
} as const;

export const workspaceRoutePaths = {
  export: '/export',
  importAnalyze: '/import/analyze',
  import: '/import'
} as const;
