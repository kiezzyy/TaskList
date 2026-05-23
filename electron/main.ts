import { app, BrowserWindow, session, shell } from 'electron';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const devUrl = 'http://localhost:5173';
let desktopServer: Server | null = null;

async function startDesktopBackend() {
  if (!app.isPackaged || desktopServer) {
    return;
  }

  const dataDir = app.getPath('userData');
  fs.mkdirSync(dataDir, { recursive: true });
  process.env.DATABASE_URL = `file:${path.join(dataDir, 'tasklist.db').replace(/\\/g, '/')}`;
  process.env.FRONTEND_ORIGIN = 'app://tasklist';
  process.env.ALLOW_FILE_ORIGIN = 'true';
  process.env.PORT = '4000';

  const backendRoot = path.join(app.getAppPath(), 'backend/dist');
  const [{ createServer }, { initializeDatabase }, { ensureSeedData }] = await Promise.all([
    import(pathToFileURL(path.join(backendRoot, 'app.js')).href),
    import(pathToFileURL(path.join(backendRoot, 'database/initSchema.js')).href),
    import(pathToFileURL(path.join(backendRoot, 'database/seed.js')).href)
  ]);

  await initializeDatabase();
  await ensureSeedData();
  desktopServer = createServer().listen(4000, '127.0.0.1');
}

async function createWindow() {
  await startDesktopBackend();

  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: 'TaskList',
    backgroundColor: '#f4f4f5',
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
    const allowedUrl = app.isPackaged ? url.startsWith('file://') : url.startsWith(devUrl);
    if (!allowedUrl) {
      event.preventDefault();
      if (isSafeExternalUrl(url)) {
        shell.openExternal(url);
      }
    }
  });

  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    window.loadURL(devUrl);
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
});

function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}
