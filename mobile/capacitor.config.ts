import type { CapacitorConfig } from '@capacitor/cli';

const productionWebUrl = readTrimmedEnv('TASKLIST_WEB_URL');

const capacitorConfig: CapacitorConfig = {
  appId: 'com.tasklist.workspace',
  appName: 'TaskList',
  webDir: '../frontend/dist',
  android: {
    path: './android'
  },
  server: productionWebUrl
    ? {
        url: productionWebUrl,
        cleartext: productionWebUrl.startsWith('http://')
      }
    : undefined
};

export default capacitorConfig;

function readTrimmedEnv(name: string) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return null;
  }

  const trimmedValue = rawValue.trim();
  return trimmedValue || null;
}
