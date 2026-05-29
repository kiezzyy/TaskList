import { Router } from 'express';
import { taskRoutePaths } from '../../config/httpRoutes.js';
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

taskRouter.get(taskRoutePaths.state, getState);
taskRouter.post(taskRoutePaths.lists, createTaskList);
taskRouter.patch(taskRoutePaths.listById, renameTaskList);
taskRouter.delete(taskRoutePaths.listById, removeTaskList);
taskRouter.post(taskRoutePaths.tasks, createNewTask);
taskRouter.patch(taskRoutePaths.taskById, editTask);
taskRouter.delete(taskRoutePaths.taskById, removeTask);
taskRouter.post(taskRoutePaths.taskRestore, restoreDeletedTask);
taskRouter.post(taskRoutePaths.taskTimerStart, startTaskTimer);
taskRouter.post(taskRoutePaths.taskTimerPause, stopTaskTimer);
taskRouter.post(taskRoutePaths.taskTimerResume, startTaskTimer);
taskRouter.post(taskRoutePaths.taskTimerStop, stopTaskTimer);
taskRouter.post(taskRoutePaths.subtasks, createNewSubtask);
taskRouter.patch(taskRoutePaths.subtaskById, editSubtask);
taskRouter.delete(taskRoutePaths.subtaskById, removeSubtask);
taskRouter.post(taskRoutePaths.subtaskTimerStart, startSubtaskTimer);
taskRouter.post(taskRoutePaths.subtaskTimerPause, stopSubtaskTimer);
taskRouter.post(taskRoutePaths.subtaskTimerResume, startSubtaskTimer);
taskRouter.post(taskRoutePaths.subtaskTimerStop, stopSubtaskTimer);
