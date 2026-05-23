import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createWorkspaceExport } from './export/exportService.js';
import { analyzeWorkspaceImport, importWorkspace } from './import/importService.js';

export const workspaceRouter = Router();
const workspaceOperationLimit = rateLimit({ windowMs: 60_000, maxRequests: 20 });

workspaceRouter.get(
  '/export',
  workspaceOperationLimit,
  asyncHandler(async (_request, response) => {
    const backup = await createWorkspaceExport();
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', `attachment; filename="tasklist-workspace-${backup.metadata.exportedAt.slice(0, 10)}.json"`);
    response.json(backup);
  })
);

workspaceRouter.post(
  '/import/analyze',
  workspaceOperationLimit,
  asyncHandler(async (request, response) => {
    response.json(await analyzeWorkspaceImport(request.body));
  })
);

workspaceRouter.post(
  '/import',
  workspaceOperationLimit,
  asyncHandler(async (request, response) => {
    const mode = z.enum(['merge', 'replace']).parse(request.query.mode ?? 'merge');
    response.json(await importWorkspace(request.body, mode));
  })
);
