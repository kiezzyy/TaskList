import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/appConfig.js';
import { applicationInfo } from './config/appConstants.js';
import { apiRoutes } from './config/httpRoutes.js';
import { requestLimits } from './config/validationLimits.js';
import { errorHandler } from './middleware/errorHandler.js';
import { taskRouter } from './task/routes/taskRoutes.js';
import { workspaceRouter } from './workspace/routes.js';

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (config.allowFileOrigin && !origin) {
          callback(null, true);
          return;
        }
        callback(null, origin === config.frontendOrigin);
      }
    })
  );
  app.use(express.json({ limit: requestLimits.jsonBody }));
  app.use(morgan('dev'));

  app.get(apiRoutes.health, (_request, response) => {
    response.json({ ok: true, app: applicationInfo.name, version: config.appVersion });
  });

  app.use(apiRoutes.root, taskRouter);
  app.use(apiRoutes.workspace, workspaceRouter);
  app.use(errorHandler);

  return app;
}
