import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { registerSystemHandlers } from './ipc/systemHandlers';
import { registerSkillsHandlers } from './ipc/skillsHandlers';
import { registerAgentsHandlers } from './ipc/agentsHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js');
  console.log('Preload path:', preloadPath);

  // Use the logo as app icon
  const iconPath = path.join(__dirname, '../../claude-owl-logo.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'Claude Owl',
    titleBarStyle: 'default',
    show: false,
  });

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
  const isDev = !app.isPackaged;
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
    // In production
    const indexPath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading from file:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set dock icon on macOS
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, '../../claude-owl-logo.png');
    app.dock.setIcon(iconPath);
  }

  // Register IPC handlers
  registerSystemHandlers();
  registerSkillsHandlers();
  registerAgentsHandlers();
  registerSettingsHandlers();

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
