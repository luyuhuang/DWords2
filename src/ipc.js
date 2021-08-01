const { DEFAULT_SETTINGS, DICTIONARIES } = require("./common");
const { getUserDB, getDictDB } = require("./database");
const { getWinByWebContentsID, getMainWin, getSetting } = require("./utils");


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
    const currentNum = 10;
    let ans
    switch (tab) {
        case "Current":
            ans = await getUserDB().all(`select * from words where plan_id = ? and status = 0 order by time limit ?`,
                planId, currentNum);
            break;
        case "Planning":
            ans = await getUserDB().all(`select * from words where plan_id = ? and status = 0 order by time limit -1 offset ?`,
                planId, currentNum);
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

async function setWordStatus(_, word, planID, status) {
    await getUserDB().run(`update words set status = ? where word = ? and plan_id = ?`, status, word, planID);
    getMainWin().webContents.send("refreshList");
}

async function consultDictionary(_, word) {
    const id = await getSetting('dictionary');
    const dict = DICTIONARIES[id]
    return await getDictDB().get(`select *, ${dict.field} as paraphrase from ${dict.table} where word = ?`, word);
}

async function getSettings(_, ...keys) {
    let res, settings
    if (keys.length > 0) {
        const ph = '?,'.repeat(keys.length).slice(0, -1);
        res = await getUserDB().all(`select * from settings where key in (${ph})`, keys);
        settings = {};
        for (key of keys) {
            settings[key] = DEFAULT_SETTINGS[key];
        }
    } else {
        res = await getUserDB().all(`select * from settings`);
        settings = {...DEFAULT_SETTINGS};
    }

    for (const {key, value} of res) {
        settings[key] = JSON.parse(value);
    }
    return settings;
}

async function updateSettings(_, settings) {
    for (const key in settings) {
        await getUserDB().run(`insert or replace into settings values (?, ?)`, key, JSON.stringify(settings[key]));
    }
    const { onSettingsUpdate } = require('./dwords');
    onSettingsUpdate(this, Object.keys(settings));
}

module.exports = {
    close, setIgnoreMouseEvents, setWinSize, moveWin, getPlans, getCurrentPlan,
    getWords, selectPlan, newPlan, addWord, getWordList, setWordStatus, consultDictionary,
    getSettings, updateSettings,
}
