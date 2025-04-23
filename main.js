const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store').default;
const store = new Store();
const fs = require('fs');

const loadConfig = require('./utils/loadConfig');
const config = loadConfig();

console.log('[ MAIN CONFIG ] Loaded config. Twitch user:', config?.twitch?.username);

const configFilePath = path.join(__dirname, 'config.js');
const blankConfigPath = path.join(__dirname, 'config.blank.js');

if (!fs.existsSync(configFilePath)) {
  fs.copyFileSync(blankConfigPath, configFilePath);
  console.log('[ CONFIG INIT  ] config.js not found, created from config.blank.js');
}

let mainWindow = null;

function createWindow() {
	const savedBounds = store.get('windowBounds');

	mainWindow = new BrowserWindow({
		width: savedBounds?.width || 1000,
		height: savedBounds?.height || 750,
		x: savedBounds?.x,
		y: savedBounds?.y,
		title: 'HandOfHateBOT Control Panel',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	mainWindow.loadFile('gui/index.html');

	// Save window position
	mainWindow.on('resize', () => store.set('windowBounds', mainWindow.getBounds()));
	mainWindow.on('move', () => store.set('windowBounds', mainWindow.getBounds()));

}

const { dialog } = require('electron');

ipcMain.handle('clipbot:chooseFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
