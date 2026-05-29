import { app, BrowserWindow, session, shell } from 'electron';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { electronAppConfig } from './config.js';

let desktopServer: Server | null = null;
let desktopPort: number | null = null;

async function startDesktopBackend() {
  if (!app.isPackaged) {
    return null;
  }

  if (desktopServer && desktopPort) {
    return desktopPort;
  }

  const dataDir = app.getPath('userData');
  fs.mkdirSync(dataDir, { recursive: true });
  process.env.DATABASE_URL = `file:${path.join(dataDir, 'tasklist.db').replace(/\\/g, '/')}`;
  process.env.FRONTEND_ORIGIN = electronAppConfig.productionFrontendOrigin;
  process.env.ALLOW_FILE_ORIGIN = 'true';

  const backendRoot = path.join(app.getAppPath(), 'backend/dist');
  const [{ createServer }, { initializeDatabase }, { ensureSeedData }] = await Promise.all([
    import(pathToFileURL(path.join(backendRoot, 'app.js')).href),
    import(pathToFileURL(path.join(backendRoot, 'database/initSchema.js')).href),
    import(pathToFileURL(path.join(backendRoot, 'database/seed.js')).href)
  ]);

  await initializeDatabase();
  await ensureSeedData();

  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    desktopServer = server.listen(0, electronAppConfig.backendHost, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        desktopPort = address.port;
        resolve(address.port);
        return;
      }

      reject(new Error('TaskList backend started without a TCP port.'));
    });
  });
}

async function createWindow() {
  const apiPort = await startDesktopBackend();

  const window = new BrowserWindow({
    width: electronAppConfig.defaultWindowWidth,
    height: electronAppConfig.defaultWindowHeight,
    minWidth: electronAppConfig.minWindowWidth,
    minHeight: electronAppConfig.minWindowHeight,
    resizable: true,
    title: electronAppConfig.appName,
    backgroundColor: electronAppConfig.backgroundColor,
    icon: app.isPackaged
      ? path.join(__dirname, '../frontend/dist/favicon.ico')
      : path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    const allowedUrl = app.isPackaged ? url.startsWith('file://') : url.startsWith(electronAppConfig.devServerUrl);
    if (!allowedUrl) {
      event.preventDefault();
      if (isSafeExternalUrl(url)) {
        shell.openExternal(url);
      }
    }
  });

  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, '../frontend/dist/index.html'), {
      query: apiPort ? { [electronAppConfig.backendPortQueryKey]: String(apiPort) } : undefined
    });
  } else {
    window.loadURL(electronAppConfig.devServerUrl);
  }
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  await createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  desktopServer?.close();
  desktopServer = null;
  desktopPort = null;
});

function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}
