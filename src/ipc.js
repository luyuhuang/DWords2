const { DICTIONARIES } = require("./common");
const { getUserDB, getDictDB } = require("./database");
const { getWinByWebContentsID, getMainWin } = require("./utils");
const settings = require('./settings');


function close(event) {
    const win = getWinByWebContentsID(event.sender.id);
    win.hide();
}

function setIgnoreMouseEvents(event, ignore, options) {
    const win = getWinByWebContentsID(event.sender.id);
    win.setIgnoreMouseEvents(ignore, options);
}

function setWinSize(event, width, height) {
    const win = getWinByWebContentsID(event.sender.id);
    win.setMinimumSize(width, height);
    win.setSize(width, height);
}

function moveWin(event, dx, dy) {
    const win = getWinByWebContentsID(event.sender.id);
    const [x, y] = win.getPosition();
    win.setPosition(x + dx, y + dy);
    event.returnValue = true;
}

async function getPlans() {
    return await getUserDB().all(`select * from plans`);
}

async function getCurrentPlan() {
    const res = await getUserDB().get(`select value from sys where key = 'currentPlan'`);
    return res && Number(res.value);
}

async function getWords(_, planID) {
    return await getUserDB().all(`select * from words where plan_id = ?`, planID);
}

async function selectPlan(_, planID) {
    await getUserDB().run(`insert or replace into sys values ('currentPlan', ?)`, planID);
}

async function newPlan(_, name) {
    const st = await getUserDB().run(`insert into plans (name) values (?)`, name);
    if (!await getCurrentPlan()) {
        await selectPlan(_, st.lastID);
    }
    return st.lastID;
}

async function addWord(_, planID, word, time, paraphrase) {
    await getUserDB().run(`insert or ignore into words (plan_id, word, time, paraphrase) values (?, ?, ?, ?)`,
        planID, word, time, paraphrase);
}

async function getWordList(_, tab) {
    const planId = await getCurrentPlan();
    const maxCurrent = await settings.getSetting('maxCurrent');
    let ans
    switch (tab) {
        case "Current":
            ans = await getUserDB().all(`select * from words where plan_id = ? and status = 0 order by time limit ?`,
                planId, maxCurrent);
            break;
        case "Planning":
            ans = await getUserDB().all(`select * from words where plan_id = ? and status = 0 order by time limit -1 offset ?`,
                planId, maxCurrent);
            break;
        case "Memorized":
            ans = await getUserDB().all(`select * from words where plan_id = ? and status = 1 order by time`,
                planId);
            break;
        case "All":
            ans = await getUserDB().all(`select * from words where plan_id = ? order by time`, planId);
            break;
    }
    return ans;
}

async function updateWord(_, word) {
    const fields = [];
    const values = [];
    for (field in word) {
        if (field !== 'word' && field !== 'plan_id') {
            fields.push(`${field} = ?`);
            values.push(word[field]);
        }
    }
    await getUserDB().run(`update words set ${fields.join(', ')} where word = ? and plan_id = ?`,
        ...values, word.word, word.plan_id);

    if ('status' in word) {
        getMainWin().webContents.send('refreshList');
    }
}

async function consultDictionary(_, word) {
    const id = await settings.getSetting('dictionary');
    const dict = DICTIONARIES[id]
    return await getDictDB().get(`select *, ${dict.field} as paraphrase from ${dict.table} where word = ?`, word);
}

async function getSettings(_, ...keys) {
    return await settings.getSettings(...keys);
}

async function updateSettings(_, s) {
    return await settings.updateSettings(this, s);
}

async function getWordsByPrefix(_, prefix) {
    const id = await settings.getSetting('dictionary');
    const dict = DICTIONARIES[id]
    const res = await getDictDB().all(`select word from ${dict.table} where word like ? limit 100`, `${prefix}%`);
    return res.map(({word}) => word);
}

function toggleDevTools() {
    getMainWin().webContents.toggleDevTools();
}

module.exports = {
    close, setIgnoreMouseEvents, setWinSize, moveWin, getPlans, getCurrentPlan,
    getWords, selectPlan, newPlan, addWord, getWordList, updateWord, consultDictionary,
    getSettings, updateSettings, getWordsByPrefix, toggleDevTools,
}
