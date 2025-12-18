import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerSystemHandlers } from './ipc/systemHandlers';
import { registerSkillsHandlers } from './ipc/skillsHandlers';
import { registerAgentsHandlers } from './ipc/agentsHandlers';
import { registerCommandsHandlers } from './ipc/commandsHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';
import { registerCCUsageHandlers } from './ipc/ccusageHandlers';
import { registerMetricsHandlers } from './ipc/metricsHandlers';
import { registerPluginsHandlers } from './ipc/pluginsHandlers';
import { registerHooksHandlers } from './ipc/hooksHandlers';
import { registerMCPHandlers } from './ipc/mcpHandlers';
import { registerStatusHandlers } from './ipc/statusHandlers';
import { registerStatusLineHandlers } from './ipc/statuslineHandlers';
import { registerDebugLogsHandlers } from './ipc/debugLogsHandlers';
import { registerGitHubImportHandlers } from './ipc/githubImportHandlers';
import { registerProjectsHandlers } from './ipc/projectsHandlers';
import { registerFileBrowserHandlers } from './ipc/fileBrowserHandlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js');
  console.log('[Main] Preload path:', preloadPath);
  console.log('[Main] Preload exists:', fs.existsSync(preloadPath));

  const isDev = !app.isPackaged;

  // Determine icon path based on environment
  let iconPath: string | undefined;
  if (isDev) {
    // Development: use project root icon
    const devIconPath = path.join(__dirname, '../../claude-owl-logo.png');
    if (fs.existsSync(devIconPath)) {
      iconPath = devIconPath;
    }
  } else {
    // Production: use icon from extraResources
    // On Windows: icon.ico, on Unix: icon.png
    const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    iconPath = path.join(process.resourcesPath, iconFile);
    console.log('[Main] Icon path (production):', iconPath);
    console.log('[Main] Icon exists:', fs.existsSync(iconPath));
  }

  const browserWindowConfig: import('electron').BrowserWindowConstructorOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true, // Enable sandbox for renderer process isolation
      webSecurity: true, // Enable CORS and origin checks
    },
    title: 'Claude Owl',
    titleBarStyle: 'default',
    show: false,
    ...(iconPath && { icon: iconPath }), // Set icon for BrowserWindow if available
  };

  mainWindow = new BrowserWindow(browserWindowConfig);

  // Show window when ready (or after timeout to ensure visibility)
  let windowShown = false;
  mainWindow.once('ready-to-show', () => {
    if (!windowShown) {
      mainWindow?.show();
      windowShown = true;
    }
  });

  // Fallback: show window after 3 seconds even if not ready (for debugging)
  setTimeout(() => {
    if (!windowShown && mainWindow && !mainWindow.isDestroyed()) {
      console.log('[Main] Showing window after timeout (ready-to-show did not fire)');
      mainWindow.show();
      windowShown = true;
    }
  }, 3000);

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log(`[Renderer] ${message}`);
  });

  // Log errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Load the app
  console.log('Is development:', isDev);
  console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);

  if (isDev) {
    // In development, use the dev server
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('Loading from dev server:', devServerUrl);
    mainWindow.loadURL(devServerUrl).catch(err => {
      console.error('Failed to load URL:', err);
    });
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from dist folder within asar
    // __dirname is .../app.asar/dist/main, so we need to go up one level to app.asar, then to dist/renderer
    const appAsar = path.join(__dirname, '../../');
    const indexPath = path.join(appAsar, 'dist/renderer/index.html');
    console.log('[Main] Loading from file:', indexPath);
    console.log('[Main] __dirname:', __dirname);
    console.log('[Main] appAsar:', appAsar);
    console.log('[Main] File exists:', fs.existsSync(indexPath));

    mainWindow.loadFile(indexPath).catch(err => {
      console.error('[Main] Failed to load file:', err);
      console.error('[Main] Error details:', {
        code: err.code,
        path: err.path,
        message: err.message,
      });
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set dock icon on macOS
  if (process.platform === 'darwin') {
    let iconPath: string;

    // In development, use the PNG logo; in production, use the icns file
    if (app.isPackaged) {
      iconPath = path.join(__dirname, '../../assets/icon.icns');
    } else {
      iconPath = path.join(__dirname, '../../claude-owl-logo.png');
    }

    if (fs.existsSync(iconPath)) {
      try {
        app.dock.setIcon(iconPath);
      } catch (error) {
        console.warn(
          'Failed to set dock icon:',
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  // Register IPC handlers
  registerSystemHandlers();
  registerSkillsHandlers();
  registerAgentsHandlers();
  registerCommandsHandlers();
  registerSettingsHandlers();
  registerCCUsageHandlers();
  registerMetricsHandlers();
  registerPluginsHandlers();
  registerHooksHandlers();
  registerMCPHandlers();
  registerStatusHandlers();
  registerStatusLineHandlers();
  registerDebugLogsHandlers();
  registerGitHubImportHandlers();
  registerProjectsHandlers();
  registerFileBrowserHandlers();

  createWindow();

  // Register keyboard shortcuts
  // Toggle DevTools with Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.toggleDevTools();
    }
  });

  // Reload with Cmd+R (Mac) or Ctrl+R (Windows/Linux)
  globalShortcut.register('CommandOrControl+R', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.reload();
    }
  });

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
