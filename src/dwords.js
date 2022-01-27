const { app, BrowserWindow, ipcMain, Tray, Menu, shell } = require('electron');
const { initDanmaku, pauseDanmaku } = require('./danmaku');
const ipc = require('./ipc');
const { initSettings, watchSettings } = require('./settings');
const { initSync } = require('./sync');
const { getMainWin } = require('./utils');
const path = require('path');
const { getUserDB, getDictDB } = require('./database');
const { checkUpdate } = require('./update');

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
    checkUpdate(true);

    watchSettings(dwords, 'maxCurrent', () => getMainWin().webContents.send('refreshList'));

    return dwords;
}

function setAppEvents() {
    app.on('activate', showWindow);
    app.on('window-all-closed', () => {});
    app.once('before-quit', async (e) => {
        e.preventDefault();
        await getUserDB().close();
        await getDictDB().close();
        app.quit();
    });
    app.on('second-instance', showWindow);
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

    mainWindow.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    mainWindow.loadFile('renderer/home.html');
}

function showWindow() {
    const mainWindow = getMainWin();
    if (mainWindow) {
        mainWindow.show();
    } else {
        createMainWindow();
    }
}

function setMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: 'DWords',
            role: 'appMenu',
            submenu: Menu.buildFromTemplate([
                { label: 'About', click: ipc.showAbout },
                { label: 'Quit DWords', role: 'quit' },
            ]),
        },
        {
            label: 'Edit',
            role: 'editMenu',
        },
        {
            label: 'Help',
            role: 'help',
            submenu: Menu.buildFromTemplate([
                { label: 'Homepage', click: () => shell.openExternal('https://github.com/luyuhuang/DWords2') },
                { label: 'Report Issue', click: () => shell.openExternal('https://github.com/luyuhuang/DWords2/issues/new') },
                { role: 'toggleDevTools' },
            ]),
        }
    ]));
}

function setTray(dwords) {
    const tray = new Tray(path.join(__dirname, '../assets/img/logo@2x.png'));
    tray.setToolTip('DWords');
    const menu = Menu.buildFromTemplate([
        {
            label: 'Exit',
            click() {
                app.quit();
            }
        },
        {
            id: 'pause',
            label: 'Pause Danmaku',
            type: 'checkbox',
            click: () => pauseDanmaku(dwords),
        },
    ]);
    tray.setContextMenu(menu);
    tray.on('click', showWindow);
    dwords.tray = tray;
    dwords.trayMenu = menu;
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
