import { z } from 'zod';
import { textLimits } from '../../config/validationLimits.js';

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''));

const safeRequiredText = (max: number) => safeText(max).pipe(z.string().min(1));
const idSchema = z.string().trim().min(1).max(textLimits.id);

export const createListSchema = z.object({ name: safeRequiredText(textLimits.taskListName) });
export const updateListSchema = createListSchema;

export const createTaskSchema = z.object({
  listId: idSchema,
  name: safeRequiredText(textLimits.taskName),
  description: safeText(textLimits.taskDescription).optional().nullable(),
  statusId: idSchema.optional(),
  priorityId: idSchema.optional()
});

export const updateTaskSchema = z.object({
  name: safeRequiredText(textLimits.taskName).optional(),
  description: safeText(textLimits.taskDescription).optional().nullable(),
  statusId: idSchema.optional(),
  priorityId: idSchema.optional()
});

export const createSubtaskSchema = z.object({
  taskId: idSchema,
  name: safeRequiredText(textLimits.taskName),
  description: safeText(textLimits.taskDescription).optional().nullable(),
  statusId: idSchema.optional()
});

export const updateSubtaskSchema = z.object({
  name: safeRequiredText(textLimits.taskName).optional(),
  description: safeText(textLimits.taskDescription).optional().nullable(),
  statusId: idSchema.optional()
});

export const taskQuerySchema = z.object({
  listId: z.string().optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['updated', 'created', 'name', 'priority']).optional()
});
