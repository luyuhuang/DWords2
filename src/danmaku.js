const { BrowserWindow, screen } = require("electron");
const { getUserDB } = require("./database");
const { getCurrentPlan, consultDictionary } = require("./ipc");
const { watchSettings, getSetting } = require("./settings");
const { getDanmakuWins } = require("./utils");

function initDanmaku(dwords) {
    dwords.currentDanmakus = new Set();
    dwords.isDanmakuPaused = false;
    setDanmakuLauncher(dwords);
    watchSettings(dwords, 'danmakuFrequency', () => setDanmakuLauncher(dwords));

    setDanmakuMover(dwords);
    watchSettings(dwords, 'danmakuSpeed', () => setDanmakuMover(dwords));

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
    danmaku.showInactive();

    const screenSize = screen.getPrimaryDisplay().size;
    const x = screenSize.width;
    const y = Math.floor(Math.random() * screenSize.height / 3);

    danmaku.setPosition(x, y);
}


async function setDanmakuLauncher(dwords) {
    if (dwords.danmakuLauncher || dwords.isDanmakuPaused) {
        clearInterval(dwords.danmakuLauncher);
    }
    if (dwords.isDanmakuPaused) return;
    const frequency = await getSetting('danmakuFrequency');
    dwords.danmakuLauncher = setInterval(() => launchDanmaku(dwords), frequency * 1000);
    launchDanmaku(dwords);
}

async function launchDanmaku(dwords) {
    const planID = await getCurrentPlan();
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

    const res = await consultDictionary(null, word.word);
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

    const speed = await getSetting('danmakuSpeed') / 100;
    let last = new Date().valueOf();
    dwords.danmakuMover = setInterval(() => {
        const now = new Date().valueOf();
        const dis = Math.round((now - last) * speed);
        last = now;
        BrowserWindow.getAllWindows().forEach((win) => {
            if (win.getTitle() !== 'Danmaku') return;
            const {x, y, width} = win.getBounds();
            if (x + width - dis <= 0) {
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

module.exports = {
    initDanmaku,
    setDanmakuLauncher
};
