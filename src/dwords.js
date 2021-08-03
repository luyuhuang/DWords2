const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const { getUserDB } = require('./database');
const ipc = require('./ipc');
const { getSetting, getDanmakuWins } = require('./utils');

function initDWords() {
    const dwords = {
        watchers: {},
    };

    setIPC(dwords);
    setAppEvents();
    createMainWindow();

    setTray(dwords);
    setDanmakuLauncher(dwords);
    setDanmakuMover(dwords);

    watchSettings(dwords, 'danmakuFrequency', () => setDanmakuLauncher(dwords));
    watchSettings(dwords, 'danmakuSpeed', () => setDanmakuMover(dwords));
    watchSettings(dwords, 'externalDictionaries', refreshDanmakus);
    watchSettings(dwords, 'danmakuTransparency', refreshDanmakus);
    watchSettings(dwords, 'danmakuSize', refreshDanmakus);
    watchSettings(dwords, 'maxPharaphraseLen', refreshDanmakus);
    watchSettings(dwords, 'danmakuColor', refreshDanmakus);
    watchSettings(dwords, 'defaultShowParaphrase', refreshDanmakus);

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

async function createDanmaku(word) {
    const danmaku = new BrowserWindow({
        show: false,
        useContentSize: true,
        resizable: false,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00ffffff',
        hasShadow: false,
        alwaysOnTop: true,
        title: 'Danmaku',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    await danmaku.loadFile('dist/danmaku.html', { query: word });
    danmaku.setSkipTaskbar(true);
    danmaku.setMenu(null);
    danmaku.showInactive();

    const screenSize = screen.getPrimaryDisplay().size;
    const x = screenSize.width;
    const y = Math.floor(Math.random() * screenSize.height / 3);

    danmaku.setPosition(x, y);
}

function showWindow() {
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'DWords')
    if (mainWindow) {
        mainWindow.show();
    } else {
        createMainWindow();
    }
}

function setTray(dwords) {
    const tray = new Tray('assets/img/logo@2x.png');
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

function refreshDanmakus() {
    getDanmakuWins().forEach(win => win.webContents.send('refreshDanmaku'));
}

async function setDanmakuLauncher(dwords) {
    if (dwords.danmakuLauncher) {
        clearInterval(dwords.danmakuLauncher);
    }

    const frequency = await getSetting('danmakuFrequency');
    dwords.danmakuLauncher = setInterval(async () => {
    // dwords.danmakuLauncher = setTimeout(async () => {
        const planID = await ipc.getCurrentPlan();
        if (!planID) return;
        const word = await getUserDB().get(`with u as (
            select * from words where plan_id = ? and status = 0
            order by time limit ?) select * from u order by random() limit 1`,
            planID, 10);
        if (!word) return;

        createDanmaku(word);
    }, frequency * 1000);
}

async function setDanmakuMover(dwords) {
    if (dwords.danmakuMover) {
        clearInterval(dwords.danmakuMover);
    }

    const speed = await getSetting('danmakuSpeed') / 100;
    let last = new Date().valueOf();
    dwords.danmakuMover = setInterval(() => {
        const now = new Date().valueOf();
        const dis = Math.round((now - last) * speed);
        last = now;
        BrowserWindow.getAllWindows().forEach((win) => {
            if (win.getTitle() !== 'Danmaku') return;
            const [x, y] = win.getPosition();
            if (x < 0) {
                win.close();
            } else {
                win.setPosition(x - dis, y);
            }
        });
    }, 20);
}

function watchSettings(dwords, key, handler) {
    let handlers = dwords.watchers[key];
    if (!handlers) {
        handlers = [];
        dwords.watchers[key] = handlers;
    }
    handlers.push(handler);
}

function onSettingsUpdate(dwords, settings) {
    for (const key of settings) {
        const handlers = dwords.watchers[key];
        if (handlers) {
            handlers.forEach(handler => handler());
        }
    }
}

module.exports = {
    initDWords, onSettingsUpdate
};
