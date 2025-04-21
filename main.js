const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store').default;
const store = new Store();
const fs = require('fs');

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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
