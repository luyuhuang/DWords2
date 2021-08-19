const { DICTIONARIES } = require("./common");
const { getUserDB, getDictDB } = require("./database");
const { getWinByWebContentsID, getMainWin, getSys, setSys, genUUID } = require("./utils");
const settings = require('./settings');
const { synchronize } = require("./sync");


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
    return await getSys('currentPlan');
}

async function getWords(_, planID) {
    return await getUserDB().all(`select * from words where plan_id = ?`, planID);
}

async function selectPlan(_, planID) {
    await setSys('currentPlan', planID);
}

const planInitializers = {
    async library(id, plan) {
        const dict = DICTIONARIES[plan.dict];
        const tag = `%${plan.tag}%`;
        const words = await getDictDB().all(`
            select word, row_number() over () as time, ${dict.field} as paraphrase
            from ${dict.table} where tag like ? order by ${plan.order}`, tag);

        const now = Date.now();
        for ({word, time, paraphrase} of words) {
            await getUserDB().run(`insert into words
                (plan_id, word, time, paraphrase, version) values (?, ?, ?, ?, ?)`,
                id, word, time, paraphrase, now);
        }
    },
};

async function newPlan(_, plan) {
    const planID = genUUID();
    await getUserDB().run(`insert into plans (id, name, version) values (?, ?, ?)`,
        planID, plan.name, Date.now());
    if (!await getCurrentPlan()) {
        await selectPlan(_, planID);
    }

    const init = planInitializers[plan.type];
    if (init) {
        await init(planID, plan);
    }

    return planID;
}

async function renamePlan(_, id, name) {
    await getUserDB().run(`update plans set name = ?, version = ? where id = ?`,
        name, Date.now(), id);
}

async function delPlan(_, id) {
    await getUserDB().run(`delete from plans where id = ?`, id);
    await getUserDB().run(`delete from words where plan_id = ?`, id);
    if (await getCurrentPlan() === id) {
        const newPlan = await getUserDB().get(`select id from plans order by id desc limit 1`);
        await selectPlan(_, newPlan ? newPlan.id : null);
    }
}

async function addWord(_, planID, word, time, paraphrase) {
    const st = await getUserDB().run(`insert or ignore into words
        (plan_id, word, time, paraphrase, version) values (?, ?, ?, ?, ?)`,
        planID, word, time, paraphrase, time);
    return st.changes;
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
    if (word.newWord) {
        const w = await getUserDB().get(`select word from words where plan_id = ? and word = ?`,
            word.plan_id, word.newWord);
        if (w) {
            return 'duplicated-new-word';
        }
    }

    word.version = Date.now();
    const fields = [];
    const values = [];
    for (const field in word) {
        if (field !== 'word' && field !== 'plan_id') {
            let f = field === 'newWord' ? 'word' : field;
            fields.push(`${f} = ?`);
            values.push(word[field]);
        }
    }
    await getUserDB().run(`update words set ${fields.join(', ')} where word = ? and plan_id = ?`,
        ...values, word.word, word.plan_id);

    if ('status' in word) {
        getMainWin().webContents.send('refreshList');
    }
}

async function delWord(_, planID, word) {
    await getUserDB().run(`delete from words where plan_id = ? and word = ?`, planID, word);
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

async function sync() {
    try {
        await synchronize(this);
    } catch(e) {
        console.log('sync err', e);
        return e;
    }
}

module.exports = {
    close, setIgnoreMouseEvents, setWinSize, moveWin, getPlans, getCurrentPlan,
    getWords, selectPlan, newPlan, renamePlan, delPlan, addWord, getWordList,
    updateWord, delWord, consultDictionary, getSettings, updateSettings, getWordsByPrefix,
    toggleDevTools, sync,
}
