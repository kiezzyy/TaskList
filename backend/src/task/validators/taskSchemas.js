import { z } from 'zod';

export const createListSchema = z.object({
  name: z.string().trim().min(1).max(120)
});

export const updateListSchema = createListSchema;

export const createTaskSchema = z.object({
  listId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(4000).optional().nullable(),
  statusId: z.string().optional()
});

export const updateTaskSchema = z.object({
  listId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(4000).optional().nullable(),
  statusId: z.string().min(1).optional()
});

export const taskQuerySchema = z.object({
  listId: z.string().optional(),
  statusId: z.string().optional(),
  search: z.string().optional()
});

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const error = new Error('Request validation failed');
    error.statusCode = 400;
    error.details = result.error.issues.map((issue) => issue.message);
    throw error;
  }
  return result.data;
}
