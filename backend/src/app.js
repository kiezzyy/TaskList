import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/appConfig.js';
import { errorHandler } from './middleware/errorHandler.js';
import { taskRouter } from './task/routes/taskRoutes.js';
import { workspaceRouter } from './workspace/routes.js';

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendOrigin }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, app: 'TaskList', version: config.appVersion });
  });

  app.use('/api', taskRouter);
  app.use('/api/workspace', workspaceRouter);
  app.use(errorHandler);

  return app;
}
