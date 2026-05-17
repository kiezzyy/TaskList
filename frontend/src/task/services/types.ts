export type TaskStatusName = 'Not Started' | 'Ongoing' | 'Completed';

export interface TaskStatus {
  id: string;
  name: TaskStatusName;
  sortOrder: number;
}

export interface TaskSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
}

export interface Task {
  id: string;
  listId: string;
  statusId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  sessions: TaskSession[];
  totalDurationSeconds: number;
  activeSession: TaskSession | null;
}

export interface TaskList {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface WorkspaceState {
  statuses: TaskStatus[];
  lists: TaskList[];
}

export interface ImportAnalysis {
  valid: boolean;
  errors?: string[];
  guidance?: string;
  metadata?: {
    appVersion: string;
    schemaVersion: number;
    exportedAt: string;
    totalTaskCount: number;
    totalTaskListCount: number;
    totalRecordedWorkDurationSeconds: number;
  };
  counts?: {
    taskLists: number;
    tasks: number;
    sessions: number;
  };
}
