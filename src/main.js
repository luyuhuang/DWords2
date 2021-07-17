const {app, BrowserWindow, ipcMain, Tray, Menu, nativeImage} = require('electron');
const path = require('path');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 580,
    minHeight: 420,
    frame: false,
    title: 'DWords',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile('dist/home.html');

  createDanmaku({
    word: 'apple',
    paraphrase: '苹果',
    showParaphrase: true,
    color: 'red',
  });
}

function createDanmaku(word) {
  const danmaku = new BrowserWindow({
    useContentSize: true,
    resizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00ffffff',
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  danmaku.loadFile('dist/danmaku.html', {query: word});
  danmaku.setSkipTaskbar(true);
}

function showWindow() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.getTitle() === 'DWords' && !win.isVisible()) {
      win.show();
    }
  }
}

let tray;

app.whenReady().then(() => {
  createWindow();
  app.on('activate', showWindow);

  tray = new Tray('assets/logo@2x.png');
  tray.setToolTip('DWords');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Exit',
      click() {
        app.quit();
      }
    }
  ]));
  tray.on('click', showWindow);
});

ipcMain.on('close', (event) => {
  const win = BrowserWindow.fromId(event.sender.id);
  win.hide();
});

ipcMain.on('setIgnoreMouseEvents', (event, ignore, options) => {
  const win = BrowserWindow.fromId(event.sender.id);
  win.setIgnoreMouseEvents(ignore, options);
});

ipcMain.on('setWinSize', (event, width, height) => {
  const win = BrowserWindow.fromId(event.sender.id);
  win.setSize(width, height);
});

app.on('window-all-closed', () => {})
