import { Router } from 'express';
import {
  createNewTask,
  createTaskList,
  deleteExistingTask,
  deleteTaskList,
  getState,
  getTasks,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  updateExistingTask,
  updateTaskList
} from '../controllers/taskController.js';

export const taskRouter = Router();

taskRouter.get('/state', getState);
taskRouter.get('/tasks', getTasks);
taskRouter.post('/lists', createTaskList);
taskRouter.patch('/lists/:id', updateTaskList);
taskRouter.delete('/lists/:id', deleteTaskList);
taskRouter.post('/tasks', createNewTask);
taskRouter.patch('/tasks/:id', updateExistingTask);
taskRouter.delete('/tasks/:id', deleteExistingTask);
taskRouter.post('/tasks/:id/timer/start', startTimer);
taskRouter.post('/tasks/:id/timer/pause', pauseTimer);
taskRouter.post('/tasks/:id/timer/resume', resumeTimer);
taskRouter.post('/tasks/:id/timer/stop', stopTimer);
