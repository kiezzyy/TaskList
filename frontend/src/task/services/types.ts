import { taskPriorityNames, taskStatusNames } from '../../shared/applicationConstants';

export type TaskStatusName = (typeof taskStatusNames)[keyof typeof taskStatusNames];
export type TaskPriorityName = (typeof taskPriorityNames)[keyof typeof taskPriorityNames];

export interface TaskStatus {
  id: string;
  name: TaskStatusName;
  sortOrder: number;
}

export interface TaskPriority {
  id: string;
  name: TaskPriorityName;
  sortOrder: number;
}

export interface TaskSession {
  id: string;
  taskId: string | null;
  subtaskId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
}

export interface Subtask {
  id: string;
  taskId: string;
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

export interface Task {
  id: string;
  listId: string;
  statusId: string;
  priorityId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  subtasks: Subtask[];
  sessions: TaskSession[];
  progress: number;
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
  priorities: TaskPriority[];
  lists: TaskList[];
  history: ActivityEvent[];
  recycleBin: RecycleBinItem[];
}

export interface ActivityEvent {
  id: string;
  type: string;
  entity: string;
  entityId: string | null;
  message: string;
  payload: string | null;
  createdAt: string;
}

export interface RecycleBinItem {
  id: string;
  entity: string;
  entityId: string;
  label: string;
  payload: string;
  deletedAt: string;
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
    totalSubtaskCount: number;
  };
  counts?: {
    taskLists: number;
    tasks: number;
    subtasks: number;
    sessions: number;
  };
}
