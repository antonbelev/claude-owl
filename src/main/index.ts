import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerSystemHandlers } from './ipc/systemHandlers';
import { registerSkillsHandlers } from './ipc/skillsHandlers';
import { registerAgentsHandlers } from './ipc/agentsHandlers';
import { registerCommandsHandlers } from './ipc/commandsHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';
import { registerCCUsageHandlers } from './ipc/ccusageHandlers';
import { registerPluginsHandlers } from './ipc/pluginsHandlers';
import { registerHooksHandlers } from './ipc/hooksHandlers';
import { registerMCPHandlers } from './ipc/mcpHandlers';
import { registerStatusHandlers } from './ipc/statusHandlers';
import { registerDebugLogsHandlers } from './ipc/debugLogsHandlers';
import { registerGitHubImportHandlers } from './ipc/githubImportHandlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js');
  console.log('Preload path:', preloadPath);

  // In packaged app, icon is set by electron-builder
  // In development, skip icon since it may not exist
  const isDev = !app.isPackaged;

  // Prepare window icon (used in dev mode, packaged app uses electron-builder config)
  const browserWindowConfig: import('electron').BrowserWindowConstructorOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'Claude Owl',
    titleBarStyle: 'default',
    show: false,
  };

  // Add icon for dev mode if available
  if (isDev) {
    const iconPath = path.join(__dirname, '../../claude-owl-logo.png');
    if (fs.existsSync(iconPath)) {
      browserWindowConfig.icon = iconPath;
    }
  }

  mainWindow = new BrowserWindow(browserWindowConfig);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

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
    const indexPath = path.join(__dirname, '../../dist/renderer/index.html');
    console.log('Loading from file:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load file:', err);
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
  registerPluginsHandlers();
  registerHooksHandlers();
  registerMCPHandlers();
  registerStatusHandlers();
  registerDebugLogsHandlers();
  registerGitHubImportHandlers();
  registerMCPHandlers();

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
