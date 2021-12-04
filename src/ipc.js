const { DICTIONARIES, DATA_DIR } = require("./common");
const { getUserDB, getDictDB } = require("./database");
const { getWinByWebContentsID, getMainWin, getSys, setSys, genUUID, parseCSV, consultDictionary: consult, findWinByTitle } = require("./utils");
const settings = require('./settings');
const { synchronize } = require("./sync");
const { dialog, app, BrowserWindow, shell, screen } = require("electron");
const { readFile, writeFile } = require("fs/promises");
const { currentLogPath } = require("./log");
const update = require('./update');
const { pauseDanmaku } = require("./danmaku");

function hide(event) {
    const win = getWinByWebContentsID(event.sender.id);
    win.hide();
}

function close(event) {
    const win = getWinByWebContentsID(event.sender.id);
    win.close();
}

function setIgnoreMouseEvents(event, ignore, options) {
    const win = getWinByWebContentsID(event.sender.id);
    win.setIgnoreMouseEvents(ignore, options);
}

function setWinSize(event, width, height) {
    const win = getWinByWebContentsID(event.sender.id);
    if (win) {
        win.setMinimumSize(width, height);
        win.setSize(width, height);
    }
}

function moveWin(event, dx, dy) {
    const win = getWinByWebContentsID(event.sender.id);
    const [x, y] = win.getPosition();
    win.setPosition(x + dx, y + dy);
    event.returnValue = true;
}

async function getPlans() {
    const plans = await getUserDB().all(`select * from plans where not deleted`);
    return plans;
}

async function getCurrentPlan() {
    const plan = await getSys('currentPlan');
    return plan;
}

async function getWords(_, planID, limit = -1, offset = 0) {
    const count = (await getUserDB().get(`select count(*) as c from words
        where plan_id = ? and not deleted`, planID)).c;
    const words = await getUserDB().all(`select * from words
        where plan_id = ? and not deleted order by time
        limit ? offset ?`, planID, limit, offset);
    return { count, words };
}

async function getWordIndex(_, planID, word) {
    const res = await getUserDB().get(`with u as (
        select row_number() over (order by time) as i, word
        from words where plan_id = ? and not deleted)
        select i from u where word = ?`, planID, word);
    return res ? res.i - 1 : -1;
}

async function selectPlan(_, planID) {
    await setSys('currentPlan', planID);
}

const importFields = [
    { name: 'word', parse: w => w },
    { name: 'paraphrase', parse: p => p },
];

async function importCSV(id, plan) {
    const data = await readFile(plan.path, {encoding: 'utf8'});
    const dictID = await settings.getSetting('dictionary');
    const { table, field } = DICTIONARIES[dictID];

    let i = 0;
    for (let {word, paraphrase} of parseCSV(importFields, data)) {
        if (!word) continue;
        if (!paraphrase) {
            const res = await getDictDB().get(`select ${field} as paraphrase
                from ${table} where word = ?`, word);
            paraphrase = res ? res.paraphrase : '';
        }
        await getUserDB().run(`insert or ignore into words
            (plan_id, word, time, paraphrase, version) values (?, ?, ?, ?, ?)`,
            id, word, ++i, paraphrase, Date.now());
    }
}

async function importJSON(id, plan) {
    const data = await readFile(plan.path, {encoding: 'utf8'});
    const content = JSON.parse(data);
    await getUserDB().run(`update plans set name = ? where id = ?`, content.name, id);

    for (const word of content.words) {
        await getUserDB().run(`insert or ignore into words
            (plan_id, word, time, paraphrase, show_paraphrase, color, status, version)
            values (?, ?, ?, ?, ?, ?, ?, ?)`,
            id, word.word, word.time, word.paraphrase, word.show_paraphrase, word.color, word.status, Date.now());
    }
}

const planInitializers = {
    async library(id, plan) {
        const dict = DICTIONARIES[plan.dict];
        const tag = `%${plan.tag}%`;
        const words = await getDictDB().all(`
            select word, ${dict.field} as paraphrase,
            row_number() over (order by ${plan.order}) as time
            from ${dict.table} where tag like ? order by ${plan.order}`, tag);

        const now = Date.now();
        for (const {word, time, paraphrase} of words) {
            await getUserDB().run(`insert into words
                (plan_id, word, time, paraphrase, version) values (?, ?, ?, ?, ?)`,
                id, word, time, paraphrase, now);
        }
    },

    async import_(id, plan) {
        const planPath = plan.path;
        if (planPath.endsWith('.csv')) {
            await importCSV(id, plan);
        } else if (planPath.endsWith('.json')) {
            await importJSON(id, plan);
        } else {
            throw new Error('Unsupported file type');
        }
    },
};

async function newPlan(_, plan) {
    const planID = genUUID();
    await getUserDB().run(`insert into plans (id, name, version) values (?, ?, ?)`,
        planID, plan.name, Date.now());

    try {
        const init = planInitializers[plan.type];
        if (init) {
            await init(planID, plan);
        }
    } catch (e) {
        await getUserDB().run(`delete from plans where id = ?`, planID);
        return {err: e};
    }

    if (!await getCurrentPlan()) {
        await selectPlan(_, planID);
    }

    return {id: planID};
}

async function renamePlan(_, id, name) {
    await getUserDB().run(`update plans set name = ?, version = ? where id = ?`,
        name, Date.now(), id);
}

async function delPlan(_, id) {
    await getUserDB().run(`update plans set
        deleted = true, version = ? where id = ?`, Date.now(), id);
    await getUserDB().run(`delete from words where plan_id = ?`, id);
    if (await getCurrentPlan() === id) {
        const newPlan = await getUserDB().get(`select id from plans where not deleted limit 1`);
        await selectPlan(_, newPlan ? newPlan.id : null);
    }
}

async function addWord(_, planID, word, time, paraphrase) {
    const w = await getUserDB().get(`select * from words
        where plan_id = ? and word = ? and not deleted`, planID, word);
    if (w) {
        return false;
    }

    await getUserDB().run(`insert or replace into words
        (plan_id, word, time, paraphrase, version) values (?, ?, ?, ?, ?)`,
        planID, word, time, paraphrase, Date.now());

    getMainWin().webContents.send('refreshList');
    return true;
}

async function getWordList(_, tab, limit = -1, offset = 0) {
    const planId = await getCurrentPlan();
    const maxCurrent = await settings.getSetting('maxCurrent');
    let sql, args;
    switch (tab) {
        case "Current":
            sql = `select * from words
                where plan_id = ? and status = 0 and not deleted
                order by time limit ?`;
            args = [planId, maxCurrent];
            break;
        case "Planning":
            sql = `select * from words
                where plan_id = ? and status = 0 and not deleted
                order by time limit -1 offset ?`;
            args = [planId, maxCurrent];
            break;
        case "Memorized":
            sql = `select * from words
                where plan_id = ? and status = 1 and not deleted
                order by time`;
            args = [planId];
            break;
        case "All":
            sql = `select * from words
                where plan_id = ? and not deleted order by time`;
            args = [planId];
            break;
    }

    const wordList = await getUserDB().all(`with u as (${sql}) select * from u limit ? offset ?`,
        ...args, limit, offset);
    return wordList;
}

async function updateWord(_, planID, word, data) {
    data.version = Date.now();
    if (data.word && word !== data.word) { // rename the word
        // if the new word already exists in the table but marked as deleted, then remove it
        await getUserDB().run(`delete from words
            where plan_id = ? and word = ? and deleted`, planID, data.word);

        // copy the word to the new name
        const st = await getUserDB().run(`insert or ignore into words
            (plan_id, word, time, paraphrase, show_paraphrase, color, status)
            select plan_id, ?, time, paraphrase, show_paraphrase, color, status
            from words where plan_id = ? and word = ?`,
            data.word, planID, word);
        if (st.changes === 0) { // copy failed, means the new word already exists
            return 'duplicated-new-word';
        }

        // mark the old word as deleted
        await getUserDB().run(`update words set deleted = true, version = ?
            where plan_id = ? and word = ?`, data.version, planID, word);

        word = data.word;
    }

    const fields = [];
    const values = [];
    for (const field in data) {
        if (field !== 'word' && field !== 'plan_id') {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    await getUserDB().run(`update words set ${fields.join(', ')} where word = ? and plan_id = ?`,
        ...values, word, planID);

    if ('status' in data) {
        getMainWin().webContents.send('refreshList');
    }
}

async function delWord(_, planID, word) {
    await getUserDB().run(`update words set
        deleted = true, version = ? where plan_id = ? and word = ?`,
        Date.now(), planID, word);
}

async function consultDictionary(_, word) {
    const res = await consult(word);
    return res;
}

async function search(_, word) {
    const planID = await getCurrentPlan();
    const res = await getUserDB().get(`select * from words
        where word = ? and plan_id = ? and not deleted`, word, planID);
    let d = await consult(word);
    if (res) {
        if (!d) {
            d = {word};
        }
        d.plan_id = planID;
        d.paraphrase = res.paraphrase;
        d.status = res.status;
    }
    return d;
}

async function getSettings(_, ...keys) {
    const st = await settings.getSettings(...keys);
    return st;
}

async function updateSettings(_, s) {
    await settings.updateSettings(this, s);
}

async function getWordsByPrefix(_, prefix) {
    const id = await settings.getSetting('dictionary');
    const dict = DICTIONARIES[id];
    const res = await getDictDB().all(`select word from ${dict.table} where word like ? limit 100`, `${prefix}%`);
    return res.map(({word}) => word);
}

function toggleDevTools() {
    getMainWin().webContents.toggleDevTools();
}

function sync() {
    synchronize(this);
}

// eslint-disable-next-line require-await
async function syncStatus() {
    return [this.syncing, this.syncErr, this.syncTime];
}

async function importPlan() {
    const file = await dialog.showOpenDialog(getMainWin(), {
        defaultPath: app.getPath('home'),
        title: 'Import plan',
        properties: ['openFile'],
        filters: [
            { name : "Plans", extensions: ['csv', 'json'] },
        ],
    });
    if (file.filePaths.length > 0) {
        return file.filePaths[0];
    }
}

async function showAbout() {
    const about = new BrowserWindow({
        show: false,
        width: 300,
        height: 261,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        minimizable: false,
        maximizable: false,
        parent: getMainWin(),
    });
    await about.loadFile('renderer/about.html', {query: {version: app.getVersion()}});
    about.setMenu(null);
    about.show();
}

function exit() {
    app.quit();
}

async function exportPlan(_, id) {
    const plan = await getUserDB().get(`select name from plans where id = ?`, id);
    const words = await getUserDB().all(`select
        word, time, paraphrase, show_paraphrase, color, status
        from words where plan_id = ? and not deleted`, id);
    plan.words = words;

    const file = await dialog.showSaveDialog(getMainWin(), {
        defaultPath: app.getPath('home'),
        title: 'Export plan',
        filters: [
            { name : "Plans", extensions: ['json'] },
        ],
    });
    if (file.filePath) {
        await writeFile(file.filePath, JSON.stringify(plan));
    }
}

async function resetPlan(_, id) {
    await getUserDB().run(`update words set
        show_paraphrase = null, color = null, status = 0, version = ?
        where plan_id = ?`, Date.now(), id);
}

function openLog() {
    shell.openPath(currentLogPath());
}

function openDataDir() {
    shell.openPath(DATA_DIR);
}

function checkUpdate() {
    update.checkUpdate(false);
}

// eslint-disable-next-line require-await
async function pauseStatus() {
    return this.isDanmakuPaused;
}

function pause() {
    pauseDanmaku(this);
}

async function openDisplayArea() {
    if (findWinByTitle('Display-area')) return;
    const displayArea = new BrowserWindow({
        useContentSize: true,
        resizable: true,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        backgroundColor: '#00ffffff',
        hasShadow: false,
        title: 'Display-area',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        show: false,
    });
    await displayArea.loadFile('renderer/displayArea.html', {query: {platform: process.platform}});
    const rect = await settings.getSetting('displayArea');
    displayArea.setBounds(rect);
    displayArea.show();
}

function setDisplayArea(event) {
    const win = getWinByWebContentsID(event.sender.id);
    settings.updateSettings(this, {displayArea: win.getBounds()});
    win.close();
}

async function resetDisplayArea(event) {
    const win = getWinByWebContentsID(event.sender.id);
    settings.updateSettings(this, {displayArea: undefined});
    const rect = await settings.getSetting('displayArea');
    win.setBounds(rect);
}

function moveMagnet(event, dx, dy) {
    const MAGNET = 10;
    const win = getWinByWebContentsID(event.sender.id);
    let {x, y, width, height} = win.getBounds();
    x += dx, y += dy;
    const bounds = screen.getDisplayMatching({x, y, width, height}).bounds;
    const a = bounds.x, b = bounds.y, c = a + bounds.width, d = b + bounds.height;
    if (Math.abs(x - a) < MAGNET) x = a;
    if (Math.abs(y - b) < MAGNET) y = b;
    if (Math.abs(x - c) < MAGNET) x = c;
    if (Math.abs(y - d) < MAGNET) y = d;
    if (Math.abs(x + width - a) < MAGNET) x = a - width;
    if (Math.abs(y + height - b) < MAGNET) y = b - height;
    if (Math.abs(x + width - c) < MAGNET) x = c - width;
    if (Math.abs(y + height - d) < MAGNET) y = d - height;

    win.setPosition(x, y);
    event.returnValue = true;
}

module.exports = {
    close, setIgnoreMouseEvents, setWinSize, moveWin, getPlans, getCurrentPlan,
    getWords, getWordIndex, selectPlan, newPlan, renamePlan, delPlan, addWord,
    getWordList, updateWord, delWord, consultDictionary, search, getSettings,
    updateSettings, getWordsByPrefix, toggleDevTools, sync, syncStatus, importPlan,
    showAbout, exit, exportPlan, resetPlan, openLog, openDataDir, checkUpdate,
    pauseStatus, pause, openDisplayArea, setDisplayArea, resetDisplayArea, hide,
    moveMagnet,
};
