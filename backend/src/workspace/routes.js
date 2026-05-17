import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createWorkspaceExport } from './export/exportService.js';
import { analyzeWorkspaceImport, importWorkspace } from './import/importService.js';

export const workspaceRouter = Router();

workspaceRouter.get(
  '/export',
  asyncHandler(async (_request, response) => {
    const backup = await createWorkspaceExport();
    const fileName = `tasklist-workspace-${backup.metadata.exportedAt.slice(0, 10)}.json`;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.json(backup);
  })
);

workspaceRouter.post(
  '/import/analyze',
  asyncHandler(async (request, response) => {
    response.json(await analyzeWorkspaceImport(request.body));
  })
);

workspaceRouter.post(
  '/import',
  asyncHandler(async (request, response) => {
    const mode = request.query.mode ?? 'merge';
    response.json(await importWorkspace(request.body, mode));
  })
);
