const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const { initDanmaku } = require('./danmaku');
const ipc = require('./ipc');
const { initSettings, watchSettings } = require('./settings');
const { initSync } = require('./sync');
const { getMainWin } = require('./utils');
const path = require('path');

function initDWords() {
    const dwords = {};

    initSettings(dwords);
    initSync(dwords);
    setIPC(dwords);
    setAppEvents();
    createMainWindow();
    setMenu();
    setTray(dwords);
    initDanmaku(dwords);

    watchSettings(dwords, 'maxCurrent', () => getMainWin().webContents.send('refreshList'));

    return dwords;
}

function setAppEvents() {
    app.on('activate', showWindow);
    app.on('window-all-closed', () => {})
}

function createMainWindow() {
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
}

function showWindow() {
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'DWords')
    if (mainWindow) {
        mainWindow.show();
    } else {
        createMainWindow();
    }
}

function setMenu() {
    // Menu.setApplicationMenu(new Menu);
}

function setTray(dwords) {
    const tray = new Tray(path.join(__dirname, '../assets/img/logo@2x.png'));
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
    dwords.tray = tray;
}

function setIPC(dwords) {
    for (const ch in ipc) {
        const f = ipc[ch].bind(dwords);
        if (f[Symbol.toStringTag] === 'AsyncFunction') {
            ipcMain.handle(ch, f);
        } else {
            ipcMain.on(ch, f);
        }
    }
}

module.exports = {
    initDWords
};
