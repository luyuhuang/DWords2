const { DEFAULT_SETTINGS } = require("./common");
const { getUserDB } = require("./database");

function initSettings(dwords) {
    dwords.watchers = {}
}

async function getSettings(...keys) {
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

async function getSetting(key) {
    const res = await getUserDB().get(`select * from settings where key = ?`, key);
    if (res) {
        return JSON.parse(res.value);
    } else {
        return DEFAULT_SETTINGS[key];
    }
}

async function updateSettings(dwords, settings) {
    for (const key in settings) {
        await getUserDB().run(`insert or replace into settings values (?, ?)`, key, JSON.stringify(settings[key]));
    }

    for (const key in settings) {
        const handlers = dwords.watchers[key];
        if (handlers) {
            handlers.forEach(handler => handler());
        }
    }
}

function watchSettings(dwords, key, handler) {
    let handlers = dwords.watchers[key];
    if (!handlers) {
        handlers = [];
        dwords.watchers[key] = handlers;
    }
    handlers.push(handler);
}

module.exports = {
    initSettings, getSettings, getSetting, updateSettings, watchSettings,
};
