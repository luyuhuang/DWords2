const AutoLaunch = require("auto-launch");
const { app, screen } = require("electron");
const { getUserDB } = require("./database");

const DEFAULT_SETTINGS = {
    dictionary: 'en-en',
    maxCurrent: 10,
    autoRun: false,
    externalDictionaries: [
        {
            name: 'Merriam Webster Dictionary',
            url: 'https://www.merriam-webster.com/dictionary/',
        },
    ],

    danmakuSpeed: 12,
    danmakuFrequency: 7,
    danmakuTransparency: 60,
    danmakuSize: 18,
    disableClick: false,
    defaultShowParaphrase: false,
    maxPharaphraseLen: 16,
    danmakuColor: 'dark',
    closeOnBlur: false,
    displayArea: () => {
        const size = screen.getPrimaryDisplay().size;
        return { x: 0, y: 0, width: size.width, height: size.height / 3 };
    },

    syncURL: null,
    username: null,
    password: null,
    syncInterval: 300,
};

function getDefaultSetting(key) {
    let v = DEFAULT_SETTINGS[key];
    if (typeof v === 'function') v = v();
    return v;
}

function initSettings(dwords) {
    dwords.watchers = {};

    watchSettings(dwords, 'autoRun', (autoRun) => {
        const autoLaunch = new AutoLaunch({
            name: 'DWords',
            path: app.getPath('exe'),
            isHidden: true,
        });

        if (autoRun) {
            autoLaunch.enable();
        } else {
            autoLaunch.disable();
        }
    });
}

async function getSettings(...keys) {
    let res;
    const settings = {};
    if (keys.length > 0) {
        const ph = '?,'.repeat(keys.length).slice(0, -1);
        res = await getUserDB().all(`select * from settings where key in (${ph})`, keys);
        for (const key of keys) {
            settings[key] = getDefaultSetting(key);
        }
    } else {
        res = await getUserDB().all(`select * from settings`);
        for (const key in DEFAULT_SETTINGS) {
            settings[key] = getDefaultSetting(key);
        }
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
        return getDefaultSetting(key);
    }
}

async function updateSettings(dwords, settings) {
    for (const key in settings) {
        if (settings[key] !== undefined) {
            await getUserDB().run(`insert or replace into settings values (?, ?)`, key, JSON.stringify(settings[key]));
        } else {
            await getUserDB().run(`delete from settings where key = ?`, key);
        }
    }

    for (const key in settings) {
        const handlers = dwords.watchers[key];
        if (handlers) {
            handlers.forEach(handler => handler(settings[key]));
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
