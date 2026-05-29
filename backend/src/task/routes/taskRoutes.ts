import { Router } from 'express';
import {
  createNewSubtask,
  createNewTask,
  createTaskList,
  editSubtask,
  editTask,
  getState,
  removeSubtask,
  removeTask,
  removeTaskList,
  renameTaskList,
  restoreDeletedTask,
  startSubtaskTimer,
  startTaskTimer,
  stopSubtaskTimer,
  stopTaskTimer
} from '../controllers/taskController.js';

export const taskRouter = Router();

taskRouter.get('/state', getState);
taskRouter.post('/lists', createTaskList);
taskRouter.patch('/lists/:id', renameTaskList);
taskRouter.delete('/lists/:id', removeTaskList);
taskRouter.post('/tasks', createNewTask);
taskRouter.patch('/tasks/:id', editTask);
taskRouter.delete('/tasks/:id', removeTask);
taskRouter.post('/tasks/:id/restore', restoreDeletedTask);
taskRouter.post('/tasks/:id/timer/start', startTaskTimer);
taskRouter.post('/tasks/:id/timer/pause', stopTaskTimer);
taskRouter.post('/tasks/:id/timer/resume', startTaskTimer);
taskRouter.post('/tasks/:id/timer/stop', stopTaskTimer);
taskRouter.post('/subtasks', createNewSubtask);
taskRouter.patch('/subtasks/:id', editSubtask);
taskRouter.delete('/subtasks/:id', removeSubtask);
taskRouter.post('/subtasks/:id/timer/start', startSubtaskTimer);
taskRouter.post('/subtasks/:id/timer/pause', stopSubtaskTimer);
taskRouter.post('/subtasks/:id/timer/resume', startSubtaskTimer);
taskRouter.post('/subtasks/:id/timer/stop', stopSubtaskTimer);
