export const config = {
  appVersion: '2.0.0',
  schemaVersion: 2,
  port: Number(process.env.PORT ?? 5000),
  host: process.env.HOST ?? '127.0.0.1',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  allowFileOrigin: process.env.ALLOW_FILE_ORIGIN === 'true'
};
