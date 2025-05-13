// ==============================================
//                    main.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store').default;
const store = new Store({ projectName: 'VOiD' });
const log = require('./gui/ui/logger')('MAIN');

// ==============================================
//               Config Management
// ==============================================

const loadConfig = require('./utils/loadConfig');
const config = loadConfig();

log.ok(`Config loaded successfully for ${config?.twitch?.streamerName || 'unknown user'}`);

const configFilePath = path.join(__dirname, 'config.js');
const blankConfigPath = path.join(__dirname, 'config.blank.js');
const { globalShortcut } = require('electron');

// ==============================================
//            config.js Auto Creation
// ==============================================

if (!fs.existsSync(configFilePath)) {
  try {
    fs.copyFileSync(blankConfigPath, configFilePath);
    log.warn(`config.js doesn't exist, creating one from config.blank.js`);

    store.set('needsSetupWizard', true);
  } catch (err) {
    log.error(`Failed to create config file: ${err.message}`);
  }
  delete require.cache[require.resolve('./config.js')];
}

// ==============================================
//                  Main Window
// ==============================================

let mainWindow = null;
let overlayWindow = null;
const OVERLAY_KEY = 'overlayWindowBounds';
let overlayIsClickThrough = false;

function createWindow() {
  const savedBounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width: savedBounds?.width || 900,
    height: savedBounds?.height || 1200,
    x: savedBounds?.x,
    y: savedBounds?.y,
    title: 'VOiD',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.on('close', () => {
    if (overlayWindow) {
      overlayWindow.close();
    }
  });

  mainWindow.removeMenu();

  mainWindow.loadFile('gui/index.html');
  log.ok('Main window created and GUI loaded');

  mainWindow.on('resize', () => store.set('windowBounds', mainWindow.getBounds()));
  mainWindow.on('move', () => store.set('windowBounds', mainWindow.getBounds()));
}

// ==============================================
//                  IPC Handlers
// ==============================================

// ==============================================
//              Window State Management
// ==============================================

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// ==============================================
//                 Dialog Handlers
// ==============================================

ipcMain.handle('clipbot:chooseFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  log.ok(`Folder selected via dialog: ${result.filePaths[0]}`);
  return result.filePaths[0];
});

ipcMain.handle('getFreshConfig', async () => {
  delete require.cache[require.resolve('./config.js')];
  return require('./config.js');
});

ipcMain.handle('dialog:select-folder', async () => {
  return dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
});

ipcMain.handle('save-log-file', async (event, { defaultPath, content }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) {
      return { success: false };
    }

    await fs.promises.writeFile(filePath, content, 'utf8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving log file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-needs-setup', () => {
  return store.get('needsSetupWizard', false);
});

ipcMain.on('setup-wizard-completed', () => {
  store.delete('needsSetupWizard');
});

// ==============================================
//                  App Lifecycle
// ==============================================

app.whenReady().then(() => {
  createWindow();

  // ==============================================
  //                 Global Shortcuts
  // ==============================================

  globalShortcut.register('Control+R', () => {
    if (mainWindow) {
      mainWindow.reload();
    }
  });

  globalShortcut.register('Control+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // ==============================================
  //               Chat Overlay Window
  // ==============================================

  ipcMain.on('toggle-chat-overlay', () => {
    if (overlayWindow) {
      overlayWindow.close();
      return;
    }

    const savedOverlayBounds = store.get(OVERLAY_KEY);

    overlayWindow = new BrowserWindow({
      width: savedOverlayBounds?.width || 600,
      height: savedOverlayBounds?.height || 800,
      x: savedOverlayBounds?.x,
      y: savedOverlayBounds?.y,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: true,
      alwaysOnTop: true,
      hasShadow: false,
      skipTaskbar: true,
      type: 'desktop',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      roundedCorners: false,
    });

    overlayWindow.setBackgroundColor('#00000000');
    overlayWindow.setHasShadow(false);

    const overlayPath = path.join(__dirname, 'gui', 'overlay.html');
    overlayWindow
      .loadFile(overlayPath)
      .then(() => {
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      })
      .catch((err) => {
        log.error('Overlay load failed:', err);
      });

    overlayWindow.on('move', () => {
      store.set(OVERLAY_KEY, overlayWindow.getBounds());
    });
    overlayWindow.on('resize', () => {
      store.set(OVERLAY_KEY, overlayWindow.getBounds());
    });

    overlayWindow.on('closed', () => {
      overlayWindow = null;
    });
  });

  ipcMain.on('close-overlay', () => {
    if (overlayWindow) overlayWindow.close();
  });

  ipcMain.on('toggle-overlay-clickthrough', () => {
    if (!overlayWindow) {
      return;
    }

    overlayIsClickThrough = !overlayIsClickThrough;
    overlayWindow.setIgnoreMouseEvents(overlayIsClickThrough, { forward: true });
    overlayWindow.webContents.send('toggle-visual-transparency');
  });

  ipcMain.on('overlay-void-mode-changed', (_, isVoid) => {
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(isVoid, { forward: true });
      overlayIsClickThrough = isVoid;
    }
  });
});

// ==============================================
//             OAuth Redirect Server
// ==============================================

const express = require('express');
const fetch = require('node-fetch');
const twitchLog = require('./gui/ui/logger')('OAUTH');

const oauthApp = express();
const PORT = 3000;

oauthApp.listen(PORT, () => {
  twitchLog.ok(`OAuth callback server listening on http://localhost:${PORT}`);
});

oauthApp.use((req, res, next) => {
  twitchLog.ok(`Incoming request: ${req.method} ${req.url}`);
  next();
});

oauthApp.get('/auth/twitch/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    twitchLog.error('Missing OAuth code in callback.');
    return res.status(400).send('Missing code.');
  }

  const config = require('./config');

  const params = new URLSearchParams();
  params.append('client_id', config.twitch.clientId);
  params.append('client_secret', config.twitch.clientSecret);
  params.append('code', code);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', config.twitch.redirectUri);

  try {
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: params,
    });
    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      twitchLog.ok('OAuth token received from Twitch.');

      const newTwitchConfig = {
        oauth: `oauth:${tokenData.access_token}`,
        bearerToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      };

      const saveConfig = require('./utils/saveConfig');
      const existing = require('./config');
      await saveConfig({
        ...existing,
        twitch: {
          ...existing.twitch,
          ...newTwitchConfig,
        },
      });

      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('configUpdatedFromOAuth', {
          updatedFields: ['twitch.oauth', 'twitch.bearerToken', 'twitch.refreshToken'],
        });
      }

      res.send('<h1>✅ Twitch login successful!</h1><p>You can close this tab.</p>');
    } else {
      twitchLog.error('OAuth token exchange failed:', tokenData);
      res.status(500).send('Failed to get access token.');
    }
  } catch (err) {
    twitchLog.error('OAuth error:', err);
    res.status(500).send('OAuth error.');
  }
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  log.ok('All windows closed — quitting app');
  if (process.platform !== 'darwin') app.quit();
});

// Make sure main.js has this handler
ipcMain.handle('twitch-oauth-login', async (event, credentials) => {
  try {
    const authManager = require('./utils/twitchAuthManager');
    const result = await authManager.performOAuth(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    return {
      success: true,
      oauth: result.oauth,
      bearerToken: result.bearerToken,
      refreshToken: result.refreshToken,
    };
  } catch (error) {
    log.error('OAuth error:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
});

// ==============================================
//             Open Links Externally
// ==============================================

const { shell } = require('electron');

app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (url !== contents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});

// ==============================================
//             Dockable Window Feature
// ==============================================

function createDockableWindow() {
  const dockWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    },
    frame: true,
  });

  const mainHtmlPath = path.join(__dirname, 'gui', 'index.html');
  dockWin.loadFile(mainHtmlPath);

  dockWin.loadURL(`file://${mainHtmlPath}?dockable=true`);

  global.dockableWindow = dockWin;

  dockWin.on('closed', () => {
    global.dockableWindow = null;
  });

  return dockWin;
}

ipcMain.on('create-dockable-window', () => {
  createDockableWindow();
});
