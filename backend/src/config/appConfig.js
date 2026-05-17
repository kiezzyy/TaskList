export const config = {
  appVersion: '1.0.0',
  schemaVersion: 1,
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'
};
