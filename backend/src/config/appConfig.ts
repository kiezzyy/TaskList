import { applicationInfo, networkDefaults } from './appConstants.js';

function parseFrontendOrigins(rawOrigins: string | undefined) {
  const fallbackOrigins = networkDefaults.frontendOrigins;
  const configuredOrigins = rawOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : fallbackOrigins;
}

export const config = {
  appVersion: applicationInfo.version,
  schemaVersion: applicationInfo.schemaVersion,
  port: Number(process.env.PORT ?? networkDefaults.backendPort),
  host: process.env.HOST ?? networkDefaults.backendHost,
  frontendOrigins: parseFrontendOrigins(process.env.FRONTEND_ORIGIN),
  allowFileOrigin: process.env.ALLOW_FILE_ORIGIN === 'true'
};
