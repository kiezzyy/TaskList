import { applicationInfo, networkDefaults } from './appConstants.js';

export const config = {
  appVersion: applicationInfo.version,
  schemaVersion: applicationInfo.schemaVersion,
  port: Number(process.env.PORT ?? networkDefaults.backendPort),
  host: process.env.HOST ?? networkDefaults.backendHost,
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? networkDefaults.frontendOrigin,
  allowFileOrigin: process.env.ALLOW_FILE_ORIGIN === 'true'
};
