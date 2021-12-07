const { BrowserWindow } = require("electron");
const { getUserDB } = require("./database");
const { watchSettings, getSetting, getSettings } = require("./settings");
const { getDanmakuWins, getMainWin, getSys, consultDictionary } = require("./utils");

function initDanmaku(dwords) {
    dwords.currentDanmakus = new Set();
    dwords.isDanmakuPaused = false;
    setDanmakuLauncher(dwords);
    watchSettings(dwords, 'danmakuFrequency', () => setDanmakuLauncher(dwords));

    setDanmakuMover(dwords);
    watchSettings(dwords, 'danmakuSpeed', () => setDanmakuMover(dwords));
    watchSettings(dwords, 'displayArea', () => setDanmakuMover(dwords));

    watchSettings(dwords, 'externalDictionaries', refreshDanmakus);
    watchSettings(dwords, 'danmakuTransparency', refreshDanmakus);
    watchSettings(dwords, 'danmakuSize', refreshDanmakus);
    watchSettings(dwords, 'maxPharaphraseLen', refreshDanmakus);
    watchSettings(dwords, 'danmakuColor', refreshDanmakus);
    watchSettings(dwords, 'defaultShowParaphrase', refreshDanmakus);
    watchSettings(dwords, 'disableClick', refreshDanmakus);
}

async function createDanmaku(word) {
    const danmaku = new BrowserWindow({
        show: false,
        useContentSize: true,
        resizable: false,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        // roundedCorners: false,
        backgroundColor: '#00ffffff',
        hasShadow: false,
        title: 'Danmaku',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    danmaku.word = word.word;

    await danmaku.loadFile('renderer/danmaku.html', { query: word });
    danmaku.setSkipTaskbar(true);
    danmaku.setMenu(null);

    const displayArea = await getSetting('displayArea');
    const x = displayArea.x + displayArea.width;
    const y = displayArea.y + Math.floor(Math.random() * displayArea.height);
    danmaku.setPosition(x, y);

    danmaku.showInactive();
    danmaku.on('blur', async () => {
        if (await getSetting('closeOnBlur')) {
            danmaku.webContents.send('deactivate');
            danmaku.setTitle('Danmaku');
        }
    });
}


async function setDanmakuLauncher(dwords) {
    if (dwords.danmakuLauncher) {
        clearInterval(dwords.danmakuLauncher);
    }
    const frequency = await getSetting('danmakuFrequency');
    dwords.danmakuLauncher = setInterval(() => launchDanmaku(dwords), frequency * 1000);
    launchDanmaku(dwords);
}

async function launchDanmaku(dwords) {
    if (dwords.isDanmakuPaused) return;
    const planID = await getSys('currentPlan');
    if (!planID) return;

    const maxCurrent = await getSetting('maxCurrent');
    const ph = '?,'.repeat(dwords.currentDanmakus.size).slice(0, -1);
    const word = await getUserDB().get(`with u as (
        select * from words where plan_id = ? and status = 0 and not deleted
        order by time limit ?)
        select * from u where word not in (${ph})
        order by random() limit 1`,
        planID, maxCurrent, ...dwords.currentDanmakus);
    if (!word) return;

    const res = await consultDictionary(word.word);
    if (res) {
        word.phonetic = res.phonetic;
    }

    dwords.currentDanmakus.add(word.word);
    createDanmaku(word);
}

async function setDanmakuMover(dwords) {
    if (dwords.danmakuMover) {
        clearInterval(dwords.danmakuMover);
    }

    const { danmakuSpeed, displayArea } = await getSettings('danmakuSpeed', 'displayArea');
    const speed = danmakuSpeed / 100;
    let last = new Date().valueOf();
    dwords.danmakuMover = setInterval(() => {
        const now = new Date().valueOf();
        const dis = Math.round((now - last) * speed);
        last = now;
        BrowserWindow.getAllWindows().forEach((win) => {
            if (!win.isVisible() || win.getTitle() !== 'Danmaku') return;
            const {x, y, width} = win.getBounds();
            if (x + width - dis <= displayArea.x) {
                win.close();
                dwords.currentDanmakus.delete(win.word);
            } else {
                win.setPosition(x - dis, y);
            }
        });
    }, 20);
}

function refreshDanmakus() {
    getDanmakuWins().forEach(win => win.webContents.send('refreshDanmaku'));
}

function pauseDanmaku(dwords) {
    dwords.isDanmakuPaused = !dwords.isDanmakuPaused;
    dwords.trayMenu.getMenuItemById('pause').checked = dwords.isDanmakuPaused;
    const win = getMainWin();
    if (win) {
        win.webContents.send('pauseStatus', dwords.isDanmakuPaused);
    }
    if (dwords.isDanmakuPaused) {
        getDanmakuWins().forEach(win => win.webContents.send('pause'));
        setTimeout(() => getDanmakuWins().forEach(win => win.close()), 500);
        dwords.currentDanmakus.clear();
    }
}

module.exports = {
    initDanmaku, pauseDanmaku,
};
