const { app, BrowserWindow } = require('electron');
const path = require('path');
const Store = require('electron-store').default;
const store = new Store();

function createWindow() {
	const savedBounds = store.get('windowBounds');

	const win = new BrowserWindow({
		width: savedBounds?.width || 1000,
		height: savedBounds?.height || 750,
		x: savedBounds?.x,
		y: savedBounds?.y,
		title: 'HandOfHateBOT Control Panel',
		webPreferences: {
			preload: path.join(__dirname, 'gui', 'renderer.js'),
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	win.loadFile('gui/index.html');

	// Save the bounds on resize or move
	win.on('resize', () => {
		store.set('windowBounds', win.getBounds());
	});
	win.on('move', () => {
		store.set('windowBounds', win.getBounds());
	});
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
